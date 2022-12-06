import nock from 'nock';
import { DownloadHTTPError, DownloadLengthMismatchError } from '../error';
import { Fetcher } from '../fetcher';

describe('Fetcher Test', () => {
  const baseURL = 'http://localhost:8080';
  const response = 'THIS IS THE TEST RESPONSE';

  describe('fetch without reaching the max limit', () => {
    beforeAll(() => {
      nock(baseURL).get('/').reply(200, response);
    });

    it('Fetch all the bytes', async () => {
      const fetcher = new Fetcher();
      const fromFetcher = await fetcher.downloadBytes(baseURL, 10000000000);

      expect(new TextDecoder().decode(fromFetcher)).toEqual(response);
    });
  });

  describe('fetch with reaching the max limit', () => {
    beforeAll(() => {
      nock(baseURL).get('/').reply(200, response);
    });

    it('Reach the max limit', async () => {
      const fetcher = new Fetcher();

      await expect(fetcher.downloadBytes(baseURL, 1)).rejects.toThrow(
        DownloadLengthMismatchError
      );
    });
  });

  describe('fetch with reaching timeout limit', () => {
    beforeAll(() => {
      nock(baseURL).get('/').reply(200, response);
    });

    it('Reach the timeout limit', async () => {
      const fetcher = new Fetcher(1);
      await expect(fetcher.downloadBytes(baseURL, 1)).rejects.toThrow(
        'network timeout at: http://localhost:8080/'
      );
    });
  });

  describe('Request Fetcher Fetch Test', () => {
    it('fetch with bad status code', async () => {
      nock(baseURL).get('/').reply(404, 'error');

      const fetcher = new Fetcher();
      await expect(fetcher.fetch(baseURL)).rejects.toThrow(DownloadHTTPError);
    });
  });
});
