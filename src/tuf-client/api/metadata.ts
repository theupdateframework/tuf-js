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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public unrecognizedFields: Record<string, any>;

  constructor(
    signed: T,
    signatures?: Record<string, Signature>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    unrecognizedFields?: Record<string, any>
  ) {
    this.signed = signed;
    this.signatures = signatures || {};
    this.unrecognizedFields = unrecognizedFields || {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static fromJSON(type: MetadataKind.Root, data: any): Metadata<Root>;
  public static fromJSON(
    type: MetadataKind.Timestamp,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): Metadata<Timestamp>;
  public static fromJSON(
    type: MetadataKind.Snapshot,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): Metadata<Snapshot>;
  public static fromJSON(
    type: MetadataKind.Targets,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): Metadata<Targets>;
  public static fromJSON(
    type: MetadataKind,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  public verifyDelegate(
    delegatedRole: string,
    delegatedMetadata: Metadata<MetadataType>
  ) {
    let role: Role | null = null;
    let keys: Record<string, Key> | null = null;
    if (this.signed.type === MetadataKind.Root) {
      const root = this.signed as Root;
      keys = root.keys;
      role = root.roles[delegatedRole];
    }

    if (!role) {
      throw new Error(`No delegation fround for ${delegatedRole}`);
    }

    if (!keys) {
      throw new Error(`No keys found`);
    }

    const signingKeys = new Set();
    for (let i = 0; i < role.keyIds.length; i++) {
      const key = keys[role.keyIds[i]] as Key;

      try {
        key.verifySignature(delegatedMetadata);
        signingKeys.add(key.keyID);
      } catch (error) {
        throw new Error(
          `Key ${key.keyID} failed to verify ${delegatedRole} with error ${error}`
        );
      }
    }
    if (signingKeys.size < role.threshold) {
      throw new Error(
        `${delegatedRole} was signed by ${signingKeys.size}/${role.threshold} keys`
      );
    }
  }
}

export interface KeyOptions {
  keyID: string;
  keyType: string;
  scheme: string;
  keyVal: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unrecognizedFields?: any;
}

export class Key {
  public keyID: string;
  public keyType: string;
  public scheme: string;
  public keyVal: Record<string, string>;
  public unrecognizedFields?: Record<string, string>;

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

  public toJSON(): JSONObject {
    return {
      [this.keyID]: {
        keytype: this.keyType,
        scheme: this.scheme,
        keyval: this.keyVal,
        ...this.unrecognizedFields,
      },
    };
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

    const signedData = metadata?.signed.toJSON();
    if (!signedData) throw new Error('No signed data found in metadata');

    try {
      const verifySignature = signer.verifySignature(
        this.keyType,
        signedData,
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

type RoleOptions = {
  keyIds: string[];
  threshold: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unrecognizedFields?: Record<string, any>;
};

function hasDuplicates(array: string[]) {
  return new Set(array).size !== array.length;
}

export class Role {
  public keyIds: string[];
  public threshold: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public unrecognizedFields: Record<string, any>;

  constructor(options: RoleOptions) {
    const { keyIds, threshold, unrecognizedFields } = options;
    if (hasDuplicates(keyIds)) {
      throw new Error(`None unqiue keyids ${keyIds}`);
    }
    if (threshold < 1) {
      throw new Error(`Threshold should be at least 1`);
    }
    this.keyIds = keyIds;
    this.threshold = threshold;
    this.unrecognizedFields = unrecognizedFields || {};
  }

  public equals(other: Role): boolean {
    if (!(other instanceof Role)) {
      return false;
    }
    return (
      this.threshold === other.threshold &&
      util.isDeepStrictEqual(this.keyIds, other.keyIds) &&
      util.isDeepStrictEqual(this.unrecognizedFields, other.unrecognizedFields)
    );
  }

  public static fromJSON(data: JSONObject): Role {
    const { keyids, threshold, ...rest } = data;
    if (!keyids && !threshold) {
      throw new Error('No able to serialize Role from JSON');
    }

    return new Role({
      keyIds: keyids as string[],
      threshold: threshold as number,
      unrecognizedFields: rest,
    });
  }

  public toJSON(): JSONObject {
    return {
      keyids: this.keyIds,
      threshold: this.threshold,
      ...this.unrecognizedFields,
    };
  }
}

type RootOptions = SignedOptions & {
  keys: Record<string, Key>;
  roles: Record<string, Role>;
  consistentSnapshot: boolean;
};

export class Root extends Signed {
  public readonly type = MetadataKind.Root;
  public keys: Record<string, Key>;
  public roles: Record<string, Role>;

  private consistentSnapshot: boolean;

  constructor(options: RootOptions) {
    super(options);

    this.keys = options.keys || {};
    this.roles = options.roles || {};
    this.consistentSnapshot = options.consistentSnapshot ?? false;

    // TODO: work on roles
  }

  public static fromJSON(data: JSONObject): Root {
    const { unrecognizedFields, ...commonFields } =
      Signed.commonFieldsFromJSON(data);
    const { keys, roles, consistent_snapshot, ...rest } = unrecognizedFields;

    const keyMap: Record<string, Key> = {};
    Object.entries(keys).forEach(([keyID, keyData]) => {
      keyMap[keyID] = Key.fromJSON(keyID, keyData);
    });

    Object.entries(roles).forEach(([roleName, roleData]) => {
      roles[roleName] = Role.fromJSON(roleData as JSONObject);
    });

    return new Root({
      ...commonFields,
      keys: keyMap,
      roles,
      consistentSnapshot: consistent_snapshot,
      unrecognizedFields: rest,
    });
  }

  public toJSON(): JSONObject {
    return {
      keys: Object.values(this.keys).reduce(
        (prev, cur) => ({ ...prev, ...cur.toJSON() }),
        {}
      ),
      roles: Object.entries(this.roles).reduce(
        (prev, [roleKey, roleValue]) => ({
          ...prev,
          [roleKey]: roleValue.toJSON(),
        }),
        {}
      ),
      consistent_snapshot: this.consistentSnapshot,
      spec_version: this.specVersion,
      version: this.version,
      expires: this.expires,
      ...this.unrecognizedFields,
    };
  }
}

export class Timestamp extends Signed {
  public type = 'Timestamp';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static fromJSON(_data: JSONValue): Timestamp {
    return new Timestamp({});
  }
  public toJSON(): JSONObject {
    return {};
  }
}

export class Snapshot extends Signed {
  public type = 'Snapshot';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static fromJSON(_data: JSONValue): Snapshot {
    return new Snapshot({});
  }
  public toJSON(): JSONObject {
    return {};
  }
}

export class Targets extends Signed {
  public type = 'Targets';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static fromJSON(_data: JSONValue): Targets {
    return new Targets({});
  }
  public toJSON(): JSONObject {
    return {};
  }
}

export class Delegations extends Signed {}
