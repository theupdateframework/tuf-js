import debug from 'debug';
import fs from 'fs';
import fetch from 'make-fetch-happen';
import util from 'util';

import { DownloadHTTPError, DownloadLengthMismatchError } from './error';
import { withTempFile } from './utils/tmpfile';

import type { MakeFetchHappenOptions } from 'make-fetch-happen';

const log = debug('tuf:fetch');

type DownloadFileHandler<T> = (file: string) => Promise<T>;

export interface Fetcher {
  downloadFile<T>(
    url: string,
    maxLength: number,
    handler: DownloadFileHandler<T>
  ): Promise<T>;
  downloadBytes(url: string, maxLength: number): Promise<Buffer>;
}

export abstract class BaseFetcher implements Fetcher {
  abstract fetch(url: string): Promise<NodeJS.ReadableStream>;

  // Download file from given URL. The file is downloaded to a temporary
  // location and then passed to the given handler. The handler is responsible
  // for moving the file to its final location. The temporary file is deleted
  // after the handler returns.
  public async downloadFile<T>(
    url: string,
    maxLength: number,
    handler: DownloadFileHandler<T>
  ): Promise<T> {
    return withTempFile(async (tmpFile) => {
      const reader = await this.fetch(url);

      let numberOfBytesReceived = 0;
      const fileStream = fs.createWriteStream(tmpFile);

      // Read the stream a chunk at a time so that we can check
      // the length of the file as we go
      try {
        for await (const chunk of reader) {
          numberOfBytesReceived += chunk.length;

          if (numberOfBytesReceived > maxLength) {
            throw new DownloadLengthMismatchError('Max length reached');
          }

          await writeBufferToStream(fileStream, chunk);
        }
      } finally {
        // Make sure we always close the stream
        // eslint-disable-next-line @typescript-eslint/unbound-method
        await util.promisify(fileStream.close).bind(fileStream)();
      }

      return handler(tmpFile);
    });
  }

  // Download bytes from given URL.
  public async downloadBytes(url: string, maxLength: number): Promise<Buffer> {
    return this.downloadFile(url, maxLength, async (file) => {
      const stream = fs.createReadStream(file);
      const chunks: Buffer[] = [];

      for await (const chunk of stream as AsyncIterable<Buffer>) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    });
  }
}

type Retry = MakeFetchHappenOptions['retry'];

interface FetcherOptions {
  timeout?: number;
  retry?: Retry;
}

export class DefaultFetcher extends BaseFetcher {
  private timeout?: number;
  private retry?: Retry;

  constructor(options: FetcherOptions = {}) {
    super();
    this.timeout = options.timeout;
    this.retry = options.retry;
  }

  public override async fetch(url: string): Promise<NodeJS.ReadableStream> {
    log('GET %s', url);
    const response = await fetch(url, {
      timeout: this.timeout,
      retry: this.retry,
    });

    if (!response.ok || !response?.body) {
      throw new DownloadHTTPError('Failed to download', response.status);
    }

    return response.body;
  }
}

const writeBufferToStream = async (
  stream: fs.WriteStream,
  buffer: string | Buffer<ArrayBufferLike>
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    stream.write(buffer, (err) => {
      if (err) {
        reject(err);
      }
      resolve(true);
    });
  });
};
