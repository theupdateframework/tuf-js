import isEqual from 'lodash.isequal';
import * as signer from '../utils/signer';
import canonicalize from 'canonicalize';
import { JSONValue } from '../utils/type';

const SPECIFICATION_VERSION = ['1', '20', '30'];
type MetadataType = Root | Timestamp | Snapshot | Targets;

interface Signature {
  keyID: string;
  sig: string;
}
export class Metadata<T extends Root | Timestamp | Snapshot | Targets> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public signatures: Record<string, Signature>;
  public signed: T;
  public unrecognizedFields: Record<string, any>;
  constructor(
    signed: T,
    signatures?: Record<string, Signature>,
    unrecognizedFields?: Record<string, any>
  ) {
    this.signatures = signatures || {};
    this.signed = signed;
    this.unrecognizedFields = unrecognizedFields || {};
  }

  public equals(other: T): boolean {
    if (!(other instanceof Metadata)) {
      return false;
    }
    return (
      this.signed === other.signed,
      isEqual(this.signatures, other.signatures),
      isEqual(this.unrecognizedFields, other.unrecognizedFields)
    );
  }

  public sign() {
    const bytes_data = canonicalize(this.signed);
    if (!bytes_data) {
      throw new Error('Problem signing the metadata');
    }

    const signature = signer.sign(bytes_data);

    // const keyId = signature?.keyid as string;
    // if (keyId){
    //   this.signatures[keyId] = signature?.;
    // }

    return signature;
  }

  // TODO after delegations
  public verifyDelegate() {}
}

function is_numeric(str: string): boolean {
  return /^\d+$/.test(str);
}

export abstract class Signed {
  public specVersion: string;
  public expires: number;
  public version: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public unrecognizedFields: Record<string, any>;

  constructor(
    version?: number,
    specVersion?: string,
    expires?: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    unrecognizedFields?: Record<string, any>
  ) {
    if (!specVersion) {
      specVersion = SPECIFICATION_VERSION.join('.');
    }
    const specList = specVersion.split('.');
    if (
      !(specList.length === 2 || specList.length === 3) ||
      !specList.every((item) => is_numeric(item))
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
      isEqual(this.unrecognizedFields, other.unrecognizedFields)
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract toJSON(): Record<string, any>;
  abstract fromJSON(data: JSONValue): Signed;

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
      isEqual(this.unrecognizedFields, other.unrecognizedFields)
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static fromJSON(keyID: string, keyDict: Record<string, any>): Key {
    // Creates ``Key`` object from its json/dict representation.
    //     Raises:
    //         KeyError, TypeError: Invalid arguments.

    const { keytype, scheme, keyval } = keyDict;
    if (keytype && scheme && keyval) {
      const keyOptions = {
        keyID: keyID,
        keyType: keytype,
        scheme: scheme,
        keyVal: keyval,
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

  // TODO:  implm the verify signature logic
  public verifySignature(metadata: Metadata<Root>) {
    // Verifies that the ``metadata.signatures`` contains a signature made
    //     with this key, correctly signing ``metadata.signed``.
    //     Args:
    //         metadata: Metadata to verify
    //         signed_serializer: ``SignedSerializer`` to serialize
    //             ``metadata.signed`` with. Default is ``CanonicalJSONSerializer``.
    //     Raises:
    //         UnsignedMetadataError: The signature could not be verified for a
    //             variety of possible reasons: see error message.

    const signature = metadata?.signatures?.[this.keyID]?.sig;
    if (!signature) throw new Error('No signature for key found in metadata');

    const publicKey = this.keyVal?.public;
    if (!publicKey) throw new Error('No spublic key found');

    const signedData = metadata?.signed;
    if (!signedData) throw new Error('No signed data found in metadata');

    try {
      // TODO: implmeent verifysignature func
      const verifySignature = signer.verifySignature(
        this.keyType,
        signedData.type,
        signature,
        publicKey
      );
      if (!verifySignature) {
        throw new Error('Failed to verify signature');
      }
    } catch (error) {
      throw new Error('Failed to verify signature');
    }
  }
}

export class Role {}

export class Root extends Signed {
  public type = 'Root';
  private consistentSnapshot: boolean;
  private keys: Record<string, Key>;

  constructor(
    version?: number,
    specVersion?: string,
    expires?: number,
    keys?: Record<string, Key>,
    roles?: Record<string, Role>,
    consistentSnapshot?: boolean,
    unrecognizedFields?: Record<string, any>
  ) {
    super(version, specVersion, expires, unrecognizedFields);
    this.consistentSnapshot = consistentSnapshot || false;
    this.keys = keys || {};

    // TODO: work on roles
  }

  public fromJSON(data: JSONValue): Root {
    const consistentSnapshot = data?.['consistent_snapshot'];
    const keys: Record<string, any> = data?.['keys'];
    const roles: Record<string, any> = data?.['roles'];


    for (const keyid in keys) {
      // TODO:
      keys[keyid] = Key.fromJSON(keyid, keys[keyid]);
    }

    for (const roleName in keys) {
      // TODO:
      // roles[roleName] = new Role().fromJSON(roleName, roles[roleName]);
    }

    return new Root(
      this.version,
      this.specVersion,
      this.expires,
      keys,
      roles,
      consistentSnapshot,
      this.unrecognizedFields
    );
  }

  public toJSON(): Record<string, any> {
    return {};
  }
}

export class Timestamp {
  public type = 'Timestamp';
}

export class Snapshot {
  public type = 'Snapshot';
}

export class Targets {
  public type = 'Targets';
}

export class Delegations {}
