export abstract class FetcherInterface {
  abstract fetch(url: string): Promise<NodeJS.ReadableStream>;

  public async downloadBytes(
    url: string,
    maxLength: number
  ): Promise<Uint8Array> {
    const reader = await this.fetch(url);

    let numberOfBytesReceived = 0;
    const chunks: Buffer[] = [];

    for await (const chunk of reader) {
      const bufferChunk = Buffer.from(chunk);
      numberOfBytesReceived += bufferChunk.length;

      if (numberOfBytesReceived > maxLength) {
        throw new Error('Max length reached');
      }

      chunks.push(bufferChunk);
    }

    // concatenate chunks into single Uint8Array
    const chunksAll = new Uint8Array(numberOfBytesReceived); // (4.1)
    let position = 0;
    for (const chunk of chunks) {
      chunksAll.set(chunk, position); // (4.2)
      position += chunk.length;
    }

    return chunksAll;
  }
}
