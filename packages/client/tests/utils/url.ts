import * as url from '../../src/utils/url';

describe('url', () => {
  describe('join', () => {
    describe('when url is valid', () => {
      it('returns the full URL', () => {
        expect(url.join('https://foo.com', '')).toBe('https://foo.com/');
        expect(url.join('https://foo.com', 'path')).toBe(
          'https://foo.com/path'
        );
        expect(url.join('https://foo.com/', 'path')).toBe(
          'https://foo.com/path'
        );
        expect(url.join('https://foo.com/', '/path')).toBe(
          'https://foo.com/path'
        );
        expect(url.join('https://foo.com', '/path')).toBe(
          'https://foo.com/path'
        );
      });
    });

    describe('when url is invalid', () => {
      it('throws an error', () => {
        expect(() => url.join('', '')).toThrow('Invalid URL');
        expect(() => url.join('', 'path')).toThrow('Invalid URL');
        expect(() => url.join('1.2.3.4', 'path')).toThrow('Invalid URL');
      });
    });
  });
});
