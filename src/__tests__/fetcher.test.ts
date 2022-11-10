import { Fetcher } from '../requestsFetcher';

describe('Fetcher Test', () => {
  const fetcher = new Fetcher();
  const testURL =
    'https://sigstore-tuf-root.storage.googleapis.com/1.root.json';

  describe('fetch without reaching the max limit', () => {
    it('example with sigstore root', async () => {
      const fromFetcher = await fetcher.downloadBytes(testURL, 10000000000);
      const fromNode = new Uint8Array(
        await (await fetch(testURL)).arrayBuffer()
      );

      expect(fromFetcher).toEqual(fromNode);
    });
  });

  describe('fetch with reaching the max limit', () => {
    it('example with sigstore root', async () => {
      const fromFetcher = await fetcher.downloadBytes(testURL, 10);
      const fromNode = new Uint8Array(
        await (await fetch(testURL)).arrayBuffer()
      );

      expect(fromFetcher).not.toEqual(fromNode);
    });
  });
});
