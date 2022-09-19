const SPECIFICATION_VERSION = ['1', '20', '30'];
export class Metadata {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public signatures: Record<any, any>;
  constructor() {
    this.signatures = {};
  }
}

export abstract class Signed {
  private specVersion: string;
  private expires: number;
  private version: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private unrecognizedFields: Record<string, any>;

  constructor(
    version?: number,
    specVersion?: string,
    expires?: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    unrecognizedFields?: Record<string, any>
  ) {
    if (!specVersion) {
      //  TODO: make it a constant var
      specVersion = SPECIFICATION_VERSION.join('.');
    }
    const specList = specVersion.split('.');
    if (
      !(specList.length === 2 || specList.length === 3) ||
      specList.every((item) => typeof item === 'number')
    ) {
      throw new Error('Failed to parse specVersion');
    }

    // major version must match
    if (specList[0] != SPECIFICATION_VERSION[0]) {
      throw new Error('Unsupported specVersion');
    }

    this.specVersion = specVersion;
    this.expires = expires || new Date().getUTCMilliseconds();
    this.version = version || 1;
    this.unrecognizedFields = unrecognizedFields || {};
  }

  public equals(other: Signed): boolean {
    if (!(other instanceof Signed)) {
      return false;
    }

    return (
      this.specVersion === other.specVersion &&
      this.expires === other.expires &&
      this.version === other.version &&
      this.unrecognizedFields === other.unrecognizedFields
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract toJSON(): Record<string, any>;

  public isExpired(referenceTime?: number): boolean {
    if (!referenceTime) {
      referenceTime = new Date().getUTCMilliseconds();
    }
    return referenceTime >= this.expires;
  }
}

export interface KeyOptions {
  keyID: string;
  keyType: string;
  scheme: string;
  keyVal: Record<string, string>;
  unrecognizedFields?: Record<string, string>;
}

export class Key {
  private keyID: string;
  private keyType: string;
  private scheme: string;
  private keyVal: Record<string, string>;
  private unrecognizedFields?: Record<string, string>;

  constructor(options: KeyOptions) {
    const { keyID, keyType, scheme, keyVal, unrecognizedFields } = options;

    this.keyID = keyID;
    this.keyType = keyType;
    this.scheme = scheme;
    this.keyVal = keyVal;
    this.unrecognizedFields = unrecognizedFields || {};
  }

  public equals(other: Key): boolean {
    if (!(other instanceof Key)) {
      return false;
    }

    return (
      this.keyID === other.keyID &&
      this.keyType === other.keyType &&
      this.scheme === other.scheme &&
      this.keyVal === other.keyVal &&
      this.unrecognizedFields === other.unrecognizedFields
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public fromJSON(keyID: string, keyDict: Record<string, any>): Key {
    // Creates ``Key`` object from its json/dict representation.
    //     Raises:
    //         KeyError, TypeError: Invalid arguments.

    const { keyType, schema, keyVal } = keyDict;
    if (keyType && schema && keyVal) {
      const keyOptions = {
        keyID: keyID,
        keyType: keyType,
        schema: schema,
        keyVal: keyVal,
        unrecognizedFields: keyDict,
      } as unknown as KeyOptions;
      return new Key(keyOptions);
    }
    throw new Error('Wrong key in keyDict');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): Record<string, any> {
    const { keyType, scheme, keyVal, unrecognizedFields } = this;
    // Returns the dictionary representation of self.
    return {
      keytype: keyType,
      scheme,
      keyval: keyVal,
      unrecognized_fields: unrecognizedFields,
    };
  }

  // TODO: involve with secureslib. will work on it later
  public verifySignature(metadata: Metadata) {
    // Verifies that the ``metadata.signatures`` contains a signature made
    //     with this key, correctly signing ``metadata.signed``.
    //     Args:
    //         metadata: Metadata to verify
    //         signed_serializer: ``SignedSerializer`` to serialize
    //             ``metadata.signed`` with. Default is ``CanonicalJSONSerializer``.
    //     Raises:
    //         UnsignedMetadataError: The signature could not be verified for a
    //             variety of possible reasons: see error message.
    let signature;
    try {
      signature = metadata?.signatures[this.keyID];
    } catch (error) {
      throw new Error('No signature for key found in metadata');
    }

    try {
      // TODO: implmeent verifysignature func
      const verifySignature = signature;
      if (!verifySignature) {
        throw new Error('Failed to verify signature');
      }
    } catch (error) {
      throw new Error('Failed to verify signature');
    }
  }
}

export class Role {}

export class Root {}

export class Delegations {}
