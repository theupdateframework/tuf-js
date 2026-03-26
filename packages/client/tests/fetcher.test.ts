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
      await expect(
        fetcher.downloadBytes(baseURL, Number.MAX_SAFE_INTEGER)
      ).rejects.toThrow('The operation was aborted due to timeout');
    });
  });

  describe('Request Fetcher Fetch Test', () => {
    it('fetch with bad status code', async () => {
      const fetcher = new DefaultFetcher();
      nock(baseURL).get('/').reply(404, 'error');
      await expect(fetcher.fetch(baseURL)).rejects.toThrow(DownloadHTTPError);
    });

    it('fetch with 500 status code', async () => {
      const fetcher = new DefaultFetcher();
      nock(baseURL).get('/internal-error').reply(500, 'error');

      await expect(
        fetcher.fetch(`${baseURL}/internal-error`)
      ).rejects.toMatchObject({
        statusCode: 500,
      });
    });

    it('retries on 500 when retry is configured', async () => {
      let attempts = 0;
      nock(baseURL)
        .get('/retry-500')
        .times(3)
        .reply(() => {
          attempts += 1;
          return [500, 'error'];
        });

      const fetcher = new DefaultFetcher({
        retry: {
          retries: 2,
          minTimeout: 1,
          maxTimeout: 1,
          randomize: false,
        },
      });

      await expect(fetcher.fetch(`${baseURL}/retry-500`)).rejects.toMatchObject(
        {
          statusCode: 500,
        }
      );
      nock(baseURL)
        .get('/suceed-after-retry')
        .reply(500, 'error')
        .get('/suceed-after-retry')
        .reply(200, response);
      expect(attempts).toBe(3);
    });

    it('succeeds after retrying on 500', async () => {
      const fetcher = new DefaultFetcher({
        retry: {
          retries: 1,
          minTimeout: 1,
          maxTimeout: 1,
          randomize: false,
        },
      });

      const result = await fetcher.fetch(`${baseURL}/suceed-after-retry`);
      const text = await new Response(result).text();
      expect(text).toBe(response);
    });
  });
});
