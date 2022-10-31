import crypto from 'crypto';
import util from 'util';
import { LengthOrHashMismatchError, ValueError } from '../error';
import { isDefined, isStringRecord } from '../utils/guard';
import { JSONObject, JSONValue } from '../utils/types';

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

  public static fromJSON(data: JSONObject): MetaFile {
    const { version, length, hashes, ...rest } = data;

    if (typeof version !== 'number') {
      throw new TypeError('version must be a number');
    }

    if (isDefined(length) && typeof length !== 'number') {
      throw new TypeError('length must be a number');
    }

    if (isDefined(hashes) && !isStringRecord(hashes)) {
      throw new TypeError('hashes must be string keys and values');
    }

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

  public static fromJSON(path: string, data: JSONObject): TargetFile {
    const { length, hashes, ...rest } = data;

    if (typeof length !== 'number') {
      throw new TypeError('length must be a number');
    }

    if (!isStringRecord(hashes)) {
      throw new TypeError('hashes must have string keys and values');
    }

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

// Check that supplied length if valid
function validateLength(length: number): void {
  if (length < 0) {
    throw new ValueError('Length must be at least 0');
  }
}
