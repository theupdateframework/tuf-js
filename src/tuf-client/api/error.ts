export class ValueError extends Error {}

class RepositoryError extends Error {}

export class UnsignedMetadataError extends RepositoryError {}

export class BadVersionError extends RepositoryError {}

export class EqualVersionNumberError extends RepositoryError {}

export class ExpiredMetadataError extends RepositoryError {}

export class LengthOrHashMismatchError extends RepositoryError {}
