import nock from 'nock';
import { DownloadHTTPError, DownloadLengthMismatchError } from '../src/error';
import { DefaultFetcher } from '../src/fetcher';

describe('Fetcher Test', () => {
  const baseURL = 'http://localhost:8080';
  const response = 'THIS IS THE TEST RESPONSE';

  describe('fetch without reaching the max limit', () => {
    beforeAll(() => {
      nock(baseURL).get('/').reply(200, response);
    });

    it('Fetch all the bytes', async () => {
      const fetcher = new DefaultFetcher();
      const fromFetcher = await fetcher.downloadBytes(baseURL, 10000000000);

      expect(fromFetcher).toStrictEqual(Buffer.from(response));
    });
  });

  describe('fetch with reaching the max limit', () => {
    beforeAll(() => {
      nock(baseURL).get('/').reply(200, response);
    });

    it('Reach the max limit', async () => {
      const fetcher = new DefaultFetcher();

      await expect(fetcher.downloadBytes(baseURL, 1)).rejects.toThrow(
        DownloadLengthMismatchError
      );
    });
  });

  describe('fetch with reaching timeout limit', () => {
    beforeAll(() => {
      nock(baseURL).get('/').delay(1000).reply(200, response);
    });

    it('Reach the timeout limit', async () => {
      const fetcher = new DefaultFetcher({ timeout: 1 });
      await expect(fetcher.downloadBytes(baseURL, Number.MAX_SAFE_INTEGER)).rejects.toThrow(
        'The operation was aborted due to timeout'
      );
    });
  });

  describe('Request Fetcher Fetch Test', () => {
    beforeAll(() => {
      nock(baseURL).get('/').reply(404, 'error');
    });
    
    it('fetch with bad status code', async () => {
      const fetcher = new DefaultFetcher();
      await expect(fetcher.fetch(baseURL)).rejects.toThrow(DownloadHTTPError);
    });
  });
});
