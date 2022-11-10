export abstract class FetcherInterface {
  abstract fetch(url: string): Promise<ReadableStreamDefaultReader<Uint8Array>>;

  public async downloadBytes(
    url: string,
    maxLength: number
  ): Promise<Uint8Array> {
    let numberOfBytesReceived = 0;

    const reader = await this.fetch(url);

    const chunks = []; // array of received binary chunks (comprises the body)
    while (numberOfBytesReceived < maxLength) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      chunks.push(value);
      numberOfBytesReceived += value.length;
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
