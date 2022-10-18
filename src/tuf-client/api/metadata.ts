import util from 'util';
import { isDefined, isObject, isObjectArray } from '../utils/guard';
import { Signable } from './base';
import { ValueError } from './error';
import { Key } from './key';
import { Role } from './role';
import { Root } from './root';
import { Signature } from './signature';
import { Snapshot } from './snapshot';
import { Targets } from './targets';
import { Timestamp } from './timestamp';
import { JSONObject, JSONValue, MetadataKind } from './types';

type MetadataType = Root | Timestamp | Snapshot | Targets;

export class Metadata<T extends MetadataType> implements Signable {
  public signed: T;
  public signatures: Record<string, Signature>;
  public unrecognizedFields: Record<string, JSONValue>;

  constructor(
    signed: T,
    signatures?: Record<string, Signature>,
    unrecognizedFields?: Record<string, JSONValue>
  ) {
    this.signed = signed;
    this.signatures = signatures || {};
    this.unrecognizedFields = unrecognizedFields || {};
  }

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
      throw new Error(`No delegation found for ${delegatedRole}`);
    }

    if (!keys) {
      throw new Error(`No keys found`);
    }

    const signingKeys = new Set();
    role.keyIDs.forEach((keyID) => {
      if (!keys?.[keyID]) {
        throw new Error(`No key found for ${keyID}`);
      }

      const key = keys[keyID] as Key;

      try {
        key.verifySignature(delegatedMetadata);
        signingKeys.add(key.keyID);
      } catch (error) {
        throw new Error(
          `Key ${key.keyID} failed to verify ${delegatedRole} with error ${error}`
        );
      }
    });

    if (signingKeys.size < role.threshold) {
      throw new Error(
        `${delegatedRole} was signed by ${signingKeys.size}/${role.threshold} keys`
      );
    }
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

  public static fromJSON(
    type: MetadataKind.Root,
    data: JSONObject
  ): Metadata<Root>;
  public static fromJSON(
    type: MetadataKind.Timestamp,
    data: JSONObject
  ): Metadata<Timestamp>;
  public static fromJSON(
    type: MetadataKind.Snapshot,
    data: JSONObject
  ): Metadata<Snapshot>;
  public static fromJSON(
    type: MetadataKind.Targets,
    data: JSONObject
  ): Metadata<Targets>;
  public static fromJSON(
    type: MetadataKind,
    data: JSONObject
  ): Metadata<MetadataType> {
    const { signed, signatures, ...rest } = data;

    if (!isDefined(signed) || !isObject(signed)) {
      throw new TypeError('signed is not defined');
    }

    if (type !== signed._type) {
      throw new ValueError(`expected '${type}', got ${signed['_type']}`);
    }

    if (!isObjectArray(signatures)) {
      throw new TypeError('signatures is not an array');
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
        throw new TypeError('invalid metadata type');
    }

    // Collect unique signatures
    const sigMap = signatures.reduce((acc, sigData) => {
      const sig = Signature.fromJSON(sigData);
      return { ...acc, [sig.keyID]: sig };
    }, {} as Record<string, Signature>);

    return new Metadata(signedObj, sigMap, rest);
  }
}
