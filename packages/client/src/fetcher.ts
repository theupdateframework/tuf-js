import debug from 'debug';
import fs from 'fs';
import util from 'util';

import { DownloadHTTPError, DownloadLengthMismatchError } from './error';
import { withTempFile } from './utils/tmpfile';
import { promiseRetry } from '@gar/promise-retry';

import type { OperationOptions, TimeoutsOptions } from 'retry';

const log = debug('tuf:fetch');

const USER_AGENT_HEADER = 'User-Agent';

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
  abstract fetch(url: string): Promise<ReadableStream<Uint8Array<ArrayBuffer>>>;

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
      const streamReader = reader.getReader();
      try {
        while (true) {
          const { done, value: chunk } = await streamReader.read();
          if (done) {
            break;
          }

          numberOfBytesReceived += chunk.length;

          if (numberOfBytesReceived > maxLength) {
            throw new DownloadLengthMismatchError('Max length reached');
          }

          await writeBufferToStream(fileStream, Buffer.from(chunk));
        }
      } finally {
        streamReader.releaseLock();
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

type Retry = boolean | number | TimeoutsOptions | undefined;

interface FetcherOptions {
  userAgent?: string;
  timeout?: number;
  retry?: Retry;
}

export class DefaultFetcher extends BaseFetcher {
  private userAgent?: string;
  private timeout?: number;
  private retry?: OperationOptions;

  constructor(options: FetcherOptions = {}) {
    super();
    this.userAgent = options.userAgent;
    this.timeout = options.timeout;
    // Map retry to OperationOptions
    if (options.retry === true) {
      this.retry = { forever: true };
    } else if (options.retry === false || options.retry === undefined) {
      this.retry = undefined;
    } else if (typeof options.retry === 'number') {
      this.retry = { retries: options.retry };
    } else {
      this.retry = options.retry;
    }
  }

  public override async fetch(
    url: string
  ): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
    const shouldRetry = this.retry !== undefined;

    return promiseRetry(
      async (retry: (err: Error) => never, number: number) => {
        log('GET %s (attempt %d)', url, number);

        let response: Response;
        try {
          response = await fetch(url, {
            headers: {
              [USER_AGENT_HEADER]: this.userAgent || '',
            },
            signal: this.timeout
              ? AbortSignal.timeout(this.timeout)
              : undefined,
          });
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          if (shouldRetry) {
            return retry(err);
          }
          throw err;
        }

        if (!response.ok || !response.body) {
          const err = new DownloadHTTPError(
            'Failed to download',
            response.status
          );
          if (shouldRetry && response.status >= 500 && response.status < 600) {
            return retry(err);
          }
          throw err;
        }

        return response.body;
      },
      this.retry
    );
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
