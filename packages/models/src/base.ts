import util from 'util';
import { ValueError } from './error';
import { Signature } from './signature';
import { guard, JSONObject, JSONValue } from './utils';

const SPECIFICATION_VERSION = ['1', '0', '31'];

export interface Signable {
  signatures: Record<string, Signature>;
  signed: Signed;
}

export interface SignedOptions {
  version: number;
  specVersion: string;
  expires: string;
  unrecognizedFields?: Record<string, JSONValue>;
}

export enum MetadataKind {
  Root = 'root',
  Timestamp = 'timestamp',
  Snapshot = 'snapshot',
  Targets = 'targets',
}

export function isMetadataKind(value: unknown): value is MetadataKind {
  return (
    typeof value === 'string' &&
    Object.values(MetadataKind).includes(value as MetadataKind)
  );
}

/***
 * A base class for the signed part of TUF metadata.
 *
 * Objects with base class Signed are usually included in a ``Metadata`` object
 * on the signed attribute. This class provides attributes and methods that
 * are common for all TUF metadata types (roles).
 */
export abstract class Signed {
  readonly specVersion: string;
  readonly expires: string;
  readonly version: number;
  readonly unrecognizedFields: Record<string, JSONValue>;

  constructor(options: SignedOptions) {
    this.specVersion = options.specVersion || SPECIFICATION_VERSION.join('.');

    const specList = this.specVersion.split('.');
    if (
      !(specList.length === 2 || specList.length === 3) ||
      !specList.every((item) => isNumeric(item))
    ) {
      throw new ValueError('Failed to parse specVersion');
    }

    // major version must match
    if (specList[0] != SPECIFICATION_VERSION[0]) {
      throw new ValueError('Unsupported specVersion');
    }

    this.expires = options.expires;
    this.version = options.version;
    this.unrecognizedFields = options.unrecognizedFields || {};
  }

  public equals(other: Signed): boolean {
    if (!(other instanceof Signed)) {
      return false;
    }

    return (
      this.specVersion === other.specVersion &&
      this.expires === other.expires &&
      this.version === other.version &&
      util.isDeepStrictEqual(this.unrecognizedFields, other.unrecognizedFields)
    );
  }

  public isExpired(referenceTime?: Date): boolean {
    if (!referenceTime) {
      referenceTime = new Date();
    }
    return referenceTime >= new Date(this.expires);
  }

  public static commonFieldsFromJSON(data: JSONObject): SignedOptions {
    const { spec_version, expires, version, ...rest } = data;

    if (!guard.isDefined(spec_version)) {
      throw new ValueError('spec_version is not defined');
    } else if (typeof spec_version !== 'string') {
      throw new TypeError('spec_version must be a string');
    }

    if (!guard.isDefined(expires)) {
      throw new ValueError('expires is not defined');
    } else if (!(typeof expires === 'string')) {
      throw new TypeError('expires must be a string');
    }

    if (!guard.isDefined(version)) {
      throw new ValueError('version is not defined');
    } else if (!(typeof version === 'number')) {
      throw new TypeError('version must be a number');
    }

    return {
      specVersion: spec_version,
      expires,
      version,
      unrecognizedFields: rest,
    };
  }

  abstract toJSON(): JSONObject;
}

function isNumeric(str: string): boolean {
  return !isNaN(Number(str));
}
