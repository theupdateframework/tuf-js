import fetch from 'make-fetch-happen';
import { DownloadHTTPError } from './error';
import { FetcherInterface } from './fetcher';

export class Fetcher extends FetcherInterface {
  constructor() {
    super();
  }

  public override async fetch(
    url: string,
    timeout?: number
  ): Promise<NodeJS.ReadableStream> {
    const response = await fetch(url, { timeout: timeout });

    if (!response.ok || !response?.body) {
      throw new DownloadHTTPError('Failed to download', response.status);
    }

    return response.body;
  }
}
