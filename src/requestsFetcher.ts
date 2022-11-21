import fetch from 'make-fetch-happen';
import { DownloadHTTPError } from './error';
import { FetcherInterface } from './fetcher';

export class Fetcher extends FetcherInterface {
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
