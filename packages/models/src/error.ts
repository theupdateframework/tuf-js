// An error about insufficient values
export class ValueError extends Error {}

// An error with a repository's state, such as a missing file.
// It covers all exceptions that come from the repository side when
// looking from the perspective of users of metadata API or ngclient.
export class RepositoryError extends Error {}

// An error about metadata object with insufficient threshold of signatures.
export class UnsignedMetadataError extends RepositoryError {}

// An error while checking the length and hash values of an object.
export class LengthOrHashMismatchError extends RepositoryError {}

export class CryptoError extends Error {}

export class UnsupportedAlgorithmError extends CryptoError {}
