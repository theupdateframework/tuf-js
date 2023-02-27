// An error about insufficient values
export class ValueError extends Error {}

export class RuntimeError extends Error {}

export class PersistError extends Error {}

// An error with a repository's state, such as a missing file.
// It covers all exceptions that come from the repository side when
// looking from the perspective of users of metadata API or ngclient.
export class RepositoryError extends Error {}

// An error for metadata that contains an invalid version number.
export class BadVersionError extends RepositoryError {}

// An error for metadata containing a previously verified version number.
export class EqualVersionError extends BadVersionError {}

// Indicate that a TUF Metadata file has expired.
export class ExpiredMetadataError extends RepositoryError {}

//----- Download Errors -------------------------------------------------------

// An error occurred while attempting to download a file.
export class DownloadError extends Error {}

// Indicate that a mismatch of lengths was seen while downloading a file
export class DownloadLengthMismatchError extends DownloadError {}

// Returned by FetcherInterface implementations for HTTP errors.
export class DownloadHTTPError extends DownloadError {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}
