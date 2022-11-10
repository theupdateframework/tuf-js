import { FetcherInterface } from './fetcher';

export class Fetcher extends FetcherInterface {
  constructor() {
    super();
  }

  public override async fetch(
    url: string
  ): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const response = await fetch(url);

    if (!response.ok || !response?.body) {
      throw new Error('Failed to download');
    }

    const reader = response.body.getReader();

    return reader;
  }
}
