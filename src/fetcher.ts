import fs from 'fs/promises';
import fetch from 'make-fetch-happen';

import { DownloadHTTPError, DownloadLengthMismatchError } from './error';
import { withTempFile } from './utils/tmpfile';

type DownloadFileHandler = (tmpFilePath: string) => Promise<Buffer>;

export abstract class BaseFetcher {
  protected timeout?: number;

  constructor(timeout?: number) {
    this.timeout = timeout;
  }

  abstract fetch(url: string): Promise<NodeJS.ReadableStream>;

  // Download file from given ``url``.
  public async downloadFile(
    url: string,
    maxLength: number,
    handler: DownloadFileHandler
  ): Promise<Buffer> {
    return withTempFile(async (tmpFile, tmpFilePath) => {
      const reader = await this.fetch(url);

      let numberOfBytesReceived = 0;

      for await (const chunk of reader) {
        const bufferChunk = Buffer.from(chunk);
        numberOfBytesReceived += bufferChunk.length;

        if (numberOfBytesReceived > maxLength) {
          throw new DownloadLengthMismatchError('Max length reached');
        }
        await tmpFile.write(bufferChunk);
      }
      return await handler(tmpFilePath);
    });
  }

  // Download bytes from given ``url``.
  public async downloadBytes(url: string, maxLength: number): Promise<Buffer> {
    return await this.downloadFile(url, maxLength, async (tmpFilePath) => {
      const readFile = await fs.open(tmpFilePath, 'r');
      const data = await readFile.readFile();
      readFile.close();
      return data;
    });
  }
}

export class Fetcher extends BaseFetcher {
  constructor(timeout?: number) {
    super(timeout);
  }

  public override async fetch(url: string): Promise<NodeJS.ReadableStream> {
    const response = await fetch(url, { timeout: this.timeout });

    if (!response.ok || !response?.body) {
      throw new DownloadHTTPError('Failed to download', response.status);
    }

    return response.body;
  }
}
