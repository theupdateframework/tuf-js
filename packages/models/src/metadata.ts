import { canonicalize } from '@tufjs/canonical-json';
import util from 'util';
import { MetadataKind, Signable } from './base';
import { UnsignedMetadataError, ValueError } from './error';
import { Key } from './key';
import { Role } from './role';
import { Root } from './root';
import { Signature } from './signature';
import { Snapshot } from './snapshot';
import { Targets } from './targets';
import { Timestamp } from './timestamp';
import { JSONObject, JSONValue, guard } from './utils';

type MetadataType = Root | Timestamp | Snapshot | Targets;

/***
 * A container for signed TUF metadata.
 *
 * Provides methods to convert to and from json, read and write to and
 * from JSON and to create and verify metadata signatures.
 *
 * ``Metadata[T]`` is a generic container type where T can be any one type of
 * [``Root``, ``Timestamp``, ``Snapshot``, ``Targets``]. The purpose of this
 * is to allow static type checking of the signed attribute in code using
 * Metadata::
 *
 * root_md = Metadata[Root].fromJSON("root.json")
 * # root_md type is now Metadata[Root]. This means signed and its
 * # attributes like consistent_snapshot are now statically typed and the
 * # types can be verified by static type checkers and shown by IDEs
 *
 * Using a type constraint is not required but not doing so means T is not a
 * specific type so static typing cannot happen. Note that the type constraint
 * ``[Root]`` is not validated at runtime (as pure annotations are not available
 * then).
 *
 * Apart from ``expires`` all of the arguments to the inner constructors have
 * reasonable default values for new metadata.
 */
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

  public sign(signer: (data: Buffer) => Signature, append = true): void {
    const bytes = Buffer.from(canonicalize(this.signed.toJSON()));
    const signature = signer(bytes);

    if (!append) {
      this.signatures = {};
    }

    this.signatures[signature.keyID] = signature;
  }

  public verifyDelegate(
    delegatedRole: string,
    delegatedMetadata: Metadata<MetadataType>
  ) {
    let role: Role | undefined;
    let keys: Record<string, Key> = {};

    switch (this.signed.type) {
      case MetadataKind.Root:
        keys = this.signed.keys;
        role = this.signed.roles[delegatedRole];
        break;
      case MetadataKind.Targets:
        if (!this.signed.delegations) {
          throw new ValueError(`No delegations found for ${delegatedRole}`);
        }
        keys = this.signed.delegations.keys;
        if (this.signed.delegations.roles) {
          role = this.signed.delegations.roles[delegatedRole];
        } else if (this.signed.delegations.succinctRoles) {
          if (
            this.signed.delegations.succinctRoles.isDelegatedRole(delegatedRole)
          ) {
            role = this.signed.delegations.succinctRoles;
          }
        }
        break;
      default:
        throw new TypeError('invalid metadata type');
    }

    if (!role) {
      throw new ValueError(`no delegation found for ${delegatedRole}`);
    }

    const signingKeys = new Set();
    role.keyIDs.forEach((keyID) => {
      const key = keys[keyID];

      // If we dont' have the key, continue checking other keys
      if (!key) {
        return;
      }

      try {
        key.verifySignature(delegatedMetadata);
        signingKeys.add(key.keyID);
      } catch (error) {
        // continue
      }
    });

    if (signingKeys.size < role.threshold) {
      throw new UnsignedMetadataError(
        `${delegatedRole} was signed by ${signingKeys.size}/${role.threshold} keys`
      );
    }
  }

  public equals(other: T): boolean {
    if (!(other instanceof Metadata)) {
      return false;
    }
    return (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.signed.equals(other.signed) &&
      util.isDeepStrictEqual(this.signatures, other.signatures) &&
      util.isDeepStrictEqual(this.unrecognizedFields, other.unrecognizedFields)
    );
  }

  public toJSON(): JSONObject {
    const signatures = Object.values(this.signatures).map((signature) => {
      return signature.toJSON();
    });

    return {
      signatures,
      signed: this.signed.toJSON(),
      ...this.unrecognizedFields,
    };
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

    if (!guard.isDefined(signed) || !guard.isObject(signed)) {
      throw new TypeError('signed is not defined');
    }

    if (type !== signed._type) {
      throw new ValueError(`expected '${type}', got ${signed['_type']}`);
    }

    if (!guard.isObjectArray(signatures)) {
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

    const sigMap: Record<string, Signature> = {};

    // Ensure that each signature is unique
    signatures.forEach((sigData) => {
      const sig = Signature.fromJSON(sigData);

      if (sigMap[sig.keyID]) {
        throw new ValueError(
          `multiple signatures found for keyid: ${sig.keyID}`
        );
      }
      sigMap[sig.keyID] = sig;
    });

    return new Metadata(signedObj, sigMap, rest);
  }
}
