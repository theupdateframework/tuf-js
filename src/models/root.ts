import util from 'util';
import { ValueError } from '../error';
import { isDefined, isObjectRecord } from '../utils/guard';
import { JSONObject, JSONValue, MetadataKind } from '../utils/types';
import { Signed, SignedOptions } from './base';
import { Key } from './key';
import { Role, TOP_LEVEL_ROLE_NAMES } from './role';

type KeyMap = Record<string, Key>;
type RoleMap = Record<string, Role>;

export interface RootOptions extends SignedOptions {
  keys?: Record<string, Key>;
  roles?: Record<string, Role>;
  consistentSnapshot?: boolean;
}

/**
 * A container for the signed part of root metadata.
 *
 * The top-level role and metadata file signed by the root keys.
 * This role specifies trusted keys for all other top-level roles, which may further delegate trust.
 */
export class Root extends Signed {
  readonly type = MetadataKind.Root;
  readonly keys: KeyMap;
  readonly roles: RoleMap;
  readonly consistentSnapshot: boolean;

  constructor(options: RootOptions) {
    super(options);

    this.keys = options.keys || {};
    this.consistentSnapshot = options.consistentSnapshot ?? true;

    if (!options.roles) {
      this.roles = TOP_LEVEL_ROLE_NAMES.reduce<RoleMap>(
        (acc, role) => ({
          ...acc,
          [role]: new Role({ keyIDs: [], threshold: 1 }),
        }),
        {}
      );
    } else {
      const roleNames = new Set(Object.keys(options.roles));
      if (!TOP_LEVEL_ROLE_NAMES.every((role) => roleNames.has(role))) {
        throw new ValueError('missing top-level role');
      }

      this.roles = options.roles;
    }
  }

  public equals(other: Root): boolean {
    if (!(other instanceof Root)) {
      return false;
    }

    return (
      super.equals(other) &&
      this.consistentSnapshot === other.consistentSnapshot &&
      util.isDeepStrictEqual(this.keys, other.keys) &&
      util.isDeepStrictEqual(this.roles, other.roles)
    );
  }

  public toJSON(): JSONObject {
    return {
      _type: this.type,
      spec_version: this.specVersion,
      version: this.version,
      expires: this.expires,
      keys: keysToJSON(this.keys),
      roles: rolesToJSON(this.roles),
      consistent_snapshot: this.consistentSnapshot,
      ...this.unrecognizedFields,
    };
  }

  public static fromJSON(data: JSONObject): Root {
    const { unrecognizedFields, ...commonFields } =
      Signed.commonFieldsFromJSON(data);
    const { keys, roles, consistent_snapshot, ...rest } =
      unrecognizedFields as {
        keys: JSONValue;
        roles: JSONValue;
        consistent_snapshot: JSONValue;
      };

    if (typeof consistent_snapshot !== 'boolean') {
      throw new TypeError('consistent_snapshot must be a boolean');
    }

    return new Root({
      ...commonFields,
      keys: keysFromJSON(keys),
      roles: rolesFromJSON(roles),
      consistentSnapshot: consistent_snapshot,
      unrecognizedFields: rest,
    });
  }
}

function keysToJSON(keys: KeyMap): JSONObject {
  return Object.entries(keys).reduce<JSONObject>(
    (acc, [keyID, key]) => ({ ...acc, [keyID]: key.toJSON() }),
    {}
  );
}

function rolesToJSON(roles: RoleMap): JSONObject {
  return Object.entries(roles).reduce<JSONObject>(
    (acc, [roleName, role]) => ({ ...acc, [roleName]: role.toJSON() }),
    {}
  );
}

function keysFromJSON(data: JSONValue): KeyMap | undefined {
  let keys: KeyMap | undefined;

  if (isDefined(data)) {
    if (!isObjectRecord(data)) {
      throw new TypeError('keys must be an object');
    }

    keys = Object.entries(data).reduce<KeyMap>(
      (acc, [keyID, keyData]) => ({
        ...acc,
        [keyID]: Key.fromJSON(keyID, keyData),
      }),
      {}
    );
  }

  return keys;
}

function rolesFromJSON(data: JSONValue): RoleMap | undefined {
  let roles: RoleMap | undefined;

  if (isDefined(data)) {
    if (!isObjectRecord(data)) {
      throw new TypeError('roles must be an object');
    }

    roles = Object.entries(data).reduce<RoleMap>(
      (acc, [roleName, roleData]) => ({
        ...acc,
        [roleName]: Role.fromJSON(roleData),
      }),
      {}
    );
  }

  return roles;
}
