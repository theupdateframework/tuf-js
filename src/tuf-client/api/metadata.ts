import canonicalize from 'canonicalize';
import util from 'util';
import * as signer from '../utils/signer';
import { JSONObject, JSONValue } from '../utils/type';
import { Signed, SignedOptions } from './signed';

export enum MetadataKind {
  Root = 'root',
  Timestamp = 'timestamp',
  Snapshot = 'snapshot',
  Targets = 'targets',
}

type MetadataType = Root | Timestamp | Snapshot | Targets;

interface Signature {
  keyID: string;
  sig: string;
}
export class Metadata<T extends Root | Timestamp | Snapshot | Targets> {
  public signed: T;
  public signatures: Record<string, Signature>;
  public unrecognizedFields: Record<string, any>;

  constructor(
    signed: T,
    signatures?: Record<string, Signature>,
    unrecognizedFields?: Record<string, any>
  ) {
    this.signed = signed;
    this.signatures = signatures || {};
    this.unrecognizedFields = unrecognizedFields || {};
  }

  public static fromJSON(type: MetadataKind.Root, data: any): Metadata<Root>;
  public static fromJSON(
    type: MetadataKind.Timestamp,
    data: any
  ): Metadata<Timestamp>;
  public static fromJSON(
    type: MetadataKind.Snapshot,
    data: any
  ): Metadata<Snapshot>;
  public static fromJSON(
    type: MetadataKind.Targets,
    data: any
  ): Metadata<Targets>;
  public static fromJSON(
    type: MetadataKind,
    data: any
  ): Metadata<MetadataType> {
    const { signed, signatures, ...rest } = data;

    if (type !== signed._type) {
      throw new Error(`Expected '${type}', got ${signed['_type']}`);
    }

    let signedObj: MetadataType;
    switch (type) {
      case MetadataKind.Root:
        signedObj = Root.fromJSON(signed);
        break;
      case MetadataKind.Timestamp:
        signedObj = Timestamp.fromJSON(signed);
        break;
      case MetadataKind.Snapshot:
        signedObj = Snapshot.fromJSON(signed);
        break;
      case MetadataKind.Targets:
        signedObj = Targets.fromJSON(signed);
        break;
      default:
        throw new Error('Not implemented');
    }

    // Collect unique signatures
    const sigs: Record<string, Signature> = {};
    signatures.forEach((sig: { keyid: string; sig: string }) => {
      sigs[sig.keyid] = { keyID: sig.keyid, sig: sig.sig };
    });

    return new Metadata(signedObj, sigs, rest);
  }

  public equals(other: T): boolean {
    if (!(other instanceof Metadata)) {
      return false;
    }
    return (
      this.signed.equals(other.signed) &&
      util.isDeepStrictEqual(this.signatures, other.signatures) &&
      util.isDeepStrictEqual(this.unrecognizedFields, other.unrecognizedFields)
    );
  }

  // TODO after delegations
  public verifyDelegate() {}
}

export interface KeyOptions {
  keyID: string;
  keyType: string;
  scheme: string;
  keyVal: Record<string, string>;
  unrecognizedFields?: any;
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
      util.isDeepStrictEqual(this.keyVal, other.keyVal) &&
      util.isDeepStrictEqual(this.unrecognizedFields, other.unrecognizedFields)
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static fromJSON(keyID: string, keyData: any): Key {
    const { keytype, scheme, keyval, ...rest } = keyData;
    const keyOptions: KeyOptions = {
      keyID,
      keyType: keytype,
      scheme,
      keyVal: keyval,
      unrecognizedFields: rest,
    };

    return new Key(keyOptions);
  }

  // TODO:  implm the verify signature logic
  public verifySignature<T extends MetadataType>(metadata: Metadata<T>) {
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

type RootOptions = SignedOptions & {
  keys: Record<string, Key>;
  roles: Record<string, Role>;
  consistentSnapshot: boolean;
};

export class Root extends Signed {
  public readonly type = MetadataKind.Root;
  public keys: Record<string, Key>;
  private consistentSnapshot: boolean;

  constructor(options: RootOptions) {
    super(options);

    this.keys = options.keys || {};
    this.consistentSnapshot = options.consistentSnapshot ?? false;

    // TODO: work on roles
  }

  public static fromJSON(data: JSONObject): Root {
    const { unrecognizedFields, ...commonFields } =
      Signed.commonFieldsFromJSON(data);
    const { keys, roles, consistent_snapshot, ...rest } = unrecognizedFields;

    const keySet: Record<string, Key> = {};
    Object.entries(keys).forEach(([keyID, keyData]) => {
      keySet[keyID] = Key.fromJSON(keyID, keyData);
    });

    for (const roleName in keys) {
      // TODO:
      // roles[roleName] = new Role().fromJSON(roleName, roles[roleName]);
    }

    return new Root({
      ...commonFields,
      keys,
      roles,
      consistentSnapshot: consistent_snapshot,
      unrecognizedFields: rest,
    });
  }

  public toJSON(): Record<string, any> {
    return {};
  }
}

export class Timestamp extends Signed {
  public type = 'Timestamp';
  public static fromJSON(data: JSONValue): Timestamp {
    return new Timestamp({});
  }
}

export class Snapshot extends Signed {
  public type = 'Snapshot';
  public static fromJSON(data: JSONValue): Snapshot {
    return new Snapshot({});
  }
}

export class Targets extends Signed {
  public type = 'Targets';
  public static fromJSON(data: JSONValue): Targets {
    return new Targets({});
  }
}

export class Delegations extends Signed {}
