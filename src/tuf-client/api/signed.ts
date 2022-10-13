import util from 'util';

const SPECIFICATION_VERSION = ['1', '20', '30'];

export interface SignedOptions {
  version?: number;
  specVersion?: string;
  expires?: number;
  unrecognizedFields?: any;
}

export abstract class Signed {
  public readonly specVersion: string;
  public readonly expires: number;
  public readonly version: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public unrecognizedFields: Record<string, any>;

  constructor(options: SignedOptions) {
    this.specVersion = options.specVersion || SPECIFICATION_VERSION.join('.');

    const specList = this.specVersion.split('.');
    if (
      !(specList.length === 2 || specList.length === 3) ||
      !specList.every((item) => isNumeric(item))
    ) {
      throw new Error('Failed to parse specVersion');
    }

    // major version must match
    if (specList[0] != SPECIFICATION_VERSION[0]) {
      throw new Error('Unsupported specVersion');
    }

    this.expires = options.expires || new Date().getTime();
    this.version = options.version || 1;
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

  public isExpired(referenceTime?: number): boolean {
    if (!referenceTime) {
      referenceTime = new Date().getTime();
    }
    return referenceTime >= this.expires;
  }

  public static commonFieldsFromJSON(data: any): SignedOptions {
    const { spec_version, expires, version, ...rest } = data;
    const exp = new Date(expires).getTime();
    return {
      specVersion: spec_version,
      expires: exp,
      version,
      unrecognizedFields: rest,
    };
  }
}

function isNumeric(str: string): boolean {
  return /^\d+$/.test(str);
}
