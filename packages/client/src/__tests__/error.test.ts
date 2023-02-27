import * as error from '../error';

describe('Error Test', () => {
  describe('Value Error', () => {
    it('Check the parent class', () => {
      expect(error.ValueError.prototype).toBeInstanceOf(Error);
    });
  });

  describe('Runtime Error', () => {
    it('Check the parent class', () => {
      expect(error.RuntimeError.prototype).toBeInstanceOf(Error);
    });
  });

  describe('Repository Error', () => {
    it('Check the parent class', () => {
      expect(error.RepositoryError.prototype).toBeInstanceOf(Error);
    });
  });

  describe('Bad Version Error', () => {
    it('Check the parent class', () => {
      expect(error.BadVersionError.prototype).toBeInstanceOf(
        error.RepositoryError
      );
    });
  });

  describe('Equal Version Error', () => {
    it('Check the parent class', () => {
      expect(error.EqualVersionError.prototype).toBeInstanceOf(
        error.BadVersionError
      );
    });
  });

  describe('Expired Metadata Error', () => {
    it('Check the parent class', () => {
      expect(error.ExpiredMetadataError.prototype).toBeInstanceOf(
        error.RepositoryError
      );
    });
  });

  describe('Download Error', () => {
    it('Check the parent class', () => {
      expect(error.DownloadError.prototype).toBeInstanceOf(Error);
    });
  });

  describe('Download Length Mismatch Error', () => {
    it('Check the parent class', () => {
      expect(error.DownloadLengthMismatchError.prototype).toBeInstanceOf(
        error.DownloadError
      );
    });
  });

  describe('Download HTTP Error', () => {
    it('Check the parent class', () => {
      expect(error.DownloadHTTPError.prototype).toBeInstanceOf(
        error.DownloadError
      );
    });

    it('Check the statusCode', () => {
      const statusCode = 404;
      const downloadHTTPError = new error.DownloadHTTPError(
        'Not Found',
        statusCode
      );
      expect(downloadHTTPError.statusCode).toEqual(statusCode);
    });
  });
});
