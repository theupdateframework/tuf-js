import crypto from 'crypto';
import util from 'util';
import { JSONObject, JSONValue } from '../utils/type';
import { LengthOrHashMismatchError, ValueError } from './error';

interface MetaFileOptions {
  version: number;
  length?: number;
  hashes?: Record<string, string>;
  unrecognizedFields?: Record<string, JSONValue>;
}

export class MetaFile {
  readonly version: number;
  readonly length?: number;
  readonly hashes?: Record<string, string>;
  readonly unrecognizedFields?: Record<string, JSONValue>;

  constructor(opts: MetaFileOptions) {
    if (opts.version <= 0) {
      throw new ValueError('Metafile version must be at least 1');
    }

    if (opts.length !== undefined) {
      validateLength(opts.length);
    }

    if (opts.hashes) {
      validateHashes(opts.hashes);
    }

    this.version = opts.version;
    this.length = opts.length;
    this.hashes = opts.hashes;
    this.unrecognizedFields = opts.unrecognizedFields || {};
  }

  public equals(other: MetaFile): boolean {
    if (!(other instanceof MetaFile)) {
      return false;
    }

    return (
      this.version === other.version &&
      this.length === other.length &&
      util.isDeepStrictEqual(this.hashes, other.hashes) &&
      util.isDeepStrictEqual(this.unrecognizedFields, other.unrecognizedFields)
    );
  }

  public verify(data: Buffer): void {
    if (this.length !== undefined) {
      verifyLength(data, this.length);
    }

    if (this.hashes) {
      verifyHashes(data, this.hashes);
    }
  }

  public toJSON(): JSONObject {
    const json: JSONObject = {
      version: this.version,
      ...this.unrecognizedFields,
    };

    if (this.length !== undefined) {
      json.length = this.length;
    }

    if (this.hashes) {
      json.hashes = this.hashes;
    }

    return json;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static fromJSON(data: any): MetaFile {
    const { version, length, hashes, ...rest } = data;

    return new MetaFile({
      version,
      length,
      hashes,
      unrecognizedFields: rest,
    });
  }
}

interface TargetFileOptions {
  length: number;
  path: string;
  hashes: Record<string, string>;
  unrecognizedFields?: Record<string, JSONValue>;
}

// Container for info about a particular target file.
export class TargetFile {
  readonly length: number;
  readonly path: string;
  readonly hashes: Record<string, string>;
  readonly unrecognizedFields: Record<string, JSONValue>;

  constructor(opts: TargetFileOptions) {
    validateLength(opts.length);
    validateHashes(opts.hashes);

    this.length = opts.length;
    this.path = opts.path;
    this.hashes = opts.hashes;
    this.unrecognizedFields = opts.unrecognizedFields || {};
  }

  get custom(): JSONValue {
    return this.unrecognizedFields['custom'];
  }

  public equals(other: TargetFile): boolean {
    if (!(other instanceof TargetFile)) {
      return false;
    }

    return (
      this.length === other.length &&
      this.path === other.path &&
      util.isDeepStrictEqual(this.hashes, other.hashes) &&
      util.isDeepStrictEqual(this.unrecognizedFields, other.unrecognizedFields)
    );
  }

  public verify(data: Buffer): void {
    verifyLength(data, this.length);
    verifyHashes(data, this.hashes);
  }

  public toJSON(): JSONObject {
    return {
      length: this.length,
      hashes: this.hashes,
      ...this.unrecognizedFields,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static fromJSON(path: string, data: any): TargetFile {
    const { length, hashes, ...rest } = data;

    return new TargetFile({
      length,
      path,
      hashes,
      unrecognizedFields: rest,
    });
  }
}

// Verifies that the given data matches the supplied hashes.
function verifyHashes(data: Buffer, hashes: Record<string, string>): void {
  Object.entries(hashes).forEach(([key, value]) => {
    let hash: crypto.Hash;

    try {
      hash = crypto.createHash(key);
    } catch (e) {
      throw new LengthOrHashMismatchError(
        `Hash algorithm ${key} not supported`
      );
    }
    const observedHash = hash.update(data).digest('hex');

    if (observedHash !== value) {
      throw new LengthOrHashMismatchError(
        `Expected hash ${value} but got ${observedHash}`
      );
    }
  });
}

// Verifies that the given data matches the expected length.
function verifyLength(data: Buffer, expectedLength: number): void {
  const observedLength = data.length;

  if (observedLength !== expectedLength) {
    throw new LengthOrHashMismatchError(
      `Expected length ${expectedLength} but got ${observedLength}`
    );
  }
}

// Check that supplied hashes are properly formed.
function validateHashes(hashes: Record<string, string>): void {
  if (!hashes) {
    throw new ValueError('Hashes must be defined');
  }

  Object.entries(hashes).forEach(([key, value]) => {
    if (typeof key !== 'string' || typeof value !== 'string') {
      throw new TypeError('Hashes must be a string');
    }
  });
}

// Check that supplied length if valid
function validateLength(length: number): void {
  if (length < 0) {
    throw new ValueError('Length must be at least 0');
  }
}
