import { SignedSerializer } from './serialization';

const SPECIFICATION_VERSION = ['1', '20', '30'];
export class Metadata {
  public signatures: Record<any, any>;
  constructor() {
    this.signatures = {};
  }
}

export abstract class Signed {
  private specVersion: string;
  private expeires: number;
  private version: number;
  private unrecognizedFields: Record<string, any>;

  constructor(
    version: number | undefined,
    specVersion: string | undefined,
    expeires: number | undefined,
    unrecognizedFields: Record<string, any> | undefined
  ) {
    if (!specVersion) {
      //  TODO: make it a constant var
      specVersion = SPECIFICATION_VERSION.join('.');
    }
    const specList = specVersion.split('.');
    if (
      !(specList.length === 2 || specList.length === 3) ||
      specList.every((item) => {
        return typeof item === 'number';
      })
    ) {
      throw new Error('Failed to parse spec_version');
    }

    // major version must match
    if (specList[0] != SPECIFICATION_VERSION[0]) {
      throw new Error('Unsupported spec_version');
    }

    this.specVersion = specVersion;
    this.expeires = expeires || new Date().getUTCMilliseconds();
    this.version = version || 1;
    this.unrecognizedFields = unrecognizedFields || {};
  }

  public isEqual(other: any): boolean {
    if (!(other instanceof Signed)) {
      return false;
    }

    return (
      this.specVersion === other.specVersion &&
      this.expeires === other.expeires &&
      this.version === other.version &&
      this.unrecognizedFields === other.unrecognizedFields
    );
  }

  abstract toDict(): Record<string, any>;
  abstract fromDict(signedDict: Record<string, any>): Signed;

  public _commonFieldsFromDict(
    signedDict: Record<string, any>
  ): [number, string, number] {
    // Returns common fields of ``Signed`` instances from the passed dict
    //     representation, and returns an ordered list to be passed as leading
    //     positional arguments to a subclass constructor.

    //     See ``{Root, Timestamp, Snapshot, Targets}.from_dict`` methods for usage.

    const _type = 'Signed';

    const version = signedDict?.['version'];
    const specVersion = signedDict?.['spec_version'];
    const expires = signedDict?.['expires'];
    // Convert 'expires' TUF metadata string to a datetime object, which is
    // what the constructor expects and what we store. The inverse operation
    // is implemented in '_common_fields_to_dict'.
    return [version, specVersion, expires];
  }

  public _commonFieldsToDict(): Record<string, any> {
    // Returns dict representation of common fields of ``Signed`` instances.
    //     See ``{Root, Timestamp, Snapshot, Targets}.to_dict`` methods for usage.
    return {
      _type: 'Signed',
      version: this.version,
      spec_version: this.specVersion,
      expires: this.expeires,
      ...this.unrecognizedFields,
    };
  }

  public isExpired(referenceTime: number | undefined): boolean {
    if (!referenceTime) {
      referenceTime = new Date().getUTCMilliseconds();
    }
    return referenceTime >= this.expeires;
  }
}

export interface KeyOptions {
  keyid: string;
  keytype: string;
  scheme: string;
  keyval: Record<string, string>;
  unrecognized_fields?: Record<string, string>;
}

export class Key {
  private keyid: string;
  private keytype: string;
  private scheme: string;
  private keyval: Record<string, string>;
  private unrecognized_fields?: Record<string, string>;

  constructor(options: KeyOptions) {
    const { keyid, keytype, scheme, keyval, unrecognized_fields } = options;

    this.keyid = keyid;
    this.keytype = keytype;
    this.scheme = scheme;
    this.keyval = keyval;
    if (unrecognized_fields === null) {
      this.unrecognized_fields = {};
    } else {
      this.unrecognized_fields = unrecognized_fields;
    }
  }

  public isEqual(other: any): boolean {
    if (!(other instanceof Key)) {
      return false;
    }

    return (
      this.keyid === other.keyid &&
      this.keytype === other.keytype &&
      this.scheme === other.scheme &&
      this.keyval === other.keyval &&
      this.unrecognized_fields === other.unrecognized_fields
    );
  }

  public fromDict(keyid: string, keyDict: Record<string, any>): Key {
    // Creates ``Key`` object from its json/dict representation.
    //     Raises:
    //         KeyError, TypeError: Invalid arguments.

    const { keytype, schema, keyval } = keyDict;
    if (keytype && schema && keyval) {
      const keyOptions = {
        keyid: keyid,
        keytype: keytype,
        schema: schema,
        keyval: keyval,
        unrecognized_fields: keyDict,
      } as unknown as KeyOptions;
      return new Key(keyOptions);
    }
    throw new Error('Wrong key in keyDict');
  }

  public toDict(): Record<string, any> {
    const { keytype, scheme, keyval, unrecognized_fields } = this;
    // Returns the dictionary representation of self.
    return {
      keytype,
      scheme,
      keyval,
      unrecognized_fields,
    };
  }

  // TODO: involve with secureslib. will work on it later
  public toSecuresystemslibKey(): Record<string, any> {
    const { keytype, scheme, keyval, keyid } = this;
    // Returns a ``Securesystemslib`` compatible representation of self.
    return {
      keyid,
      keytype,
      scheme,
      keyval,
    };
  }

  // TODO: involve with secureslib. will work on it later
  // public fromSecuresystemslibKey() {

  // }

  // TODO: involve with secureslib. will work on it later
  public verifySignature(
    metadata: Metadata,
    signed_serializer: SignedSerializer | undefined
  ) {
    // Verifies that the ``metadata.signatures`` contains a signature made
    //     with this key, correctly signing ``metadata.signed``.
    //     Args:
    //         metadata: Metadata to verify
    //         signed_serializer: ``SignedSerializer`` to serialize
    //             ``metadata.signed`` with. Default is ``CanonicalJSONSerializer``.
    //     Raises:
    //         UnsignedMetadataError: The signature could not be verified for a
    //             variety of possible reasons: see error message.
    try {
      const signature = metadata?.signatures[this.keyid];
    } catch (error) {
      throw new Error('No signature for key found in metadata');
    }
    if (signed_serializer === undefined) {
      signed_serializer = new CanonicalJSONSerializer();
    }

    try {
      // TODO: implmeent verifysignature func
      const sslib_keys_verifySignature = false;
      if (!sslib_keys_verifySignature) {
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
