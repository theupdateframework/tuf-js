import fetch from 'make-fetch-happen';
import { DownloadHTTPError, DownloadLengthMismatchError } from './error';

export abstract class BaseFetcher {
  protected timeout?: number;

  constructor(timeout?: number) {
    this.timeout = timeout;
  }

  abstract fetch(url: string): Promise<NodeJS.ReadableStream>;

  public async downloadBytes(url: string, maxLength: number): Promise<Buffer> {
    const reader = await this.fetch(url);

    let numberOfBytesReceived = 0;
    const chunks: Buffer[] = [];

    for await (const chunk of reader) {
      const bufferChunk = Buffer.from(chunk);
      numberOfBytesReceived += bufferChunk.length;

      if (numberOfBytesReceived > maxLength) {
        throw new DownloadLengthMismatchError('Max length reached');
      }

      chunks.push(bufferChunk);
    }

    // concatenate chunks into a single buffer
    return Buffer.concat(chunks);
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
