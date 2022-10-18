import util from 'util';
import { isDefined, isObjectArray, isObjectRecord } from '../utils/guard';
import { ValueError } from './error';
import { Key } from './key';
import { DelegatedRole, TOP_LEVEL_ROLE_NAMES } from './role';
import { JSONObject, JSONValue } from './types';

type DelegatedRoleMap = Record<string, DelegatedRole>;
type KeyMap = Record<string, Key>;

interface DelegationsOptions {
  keys: KeyMap;
  roles?: DelegatedRoleMap;
  unrecognizedFields?: Record<string, JSONValue>;
}

export class Delegations {
  readonly keys: KeyMap;
  readonly roles?: DelegatedRoleMap;
  readonly unrecognizedFields?: Record<string, JSONValue>;

  constructor(options: DelegationsOptions) {
    this.keys = options.keys;
    this.unrecognizedFields = options.unrecognizedFields || {};

    if (options.roles) {
      if (
        Object.keys(options.roles).some((roleName) =>
          TOP_LEVEL_ROLE_NAMES.includes(roleName)
        )
      ) {
        throw new ValueError(
          'Delegated role name conflicts with top-level role name'
        );
      }
    }
    this.roles = options.roles;
  }

  public equals(other: Delegations): boolean {
    if (!(other instanceof Delegations)) {
      return false;
    }

    return (
      util.isDeepStrictEqual(this.keys, other.keys) &&
      util.isDeepStrictEqual(this.roles, other.roles) &&
      util.isDeepStrictEqual(this.unrecognizedFields, other.unrecognizedFields)
    );
  }

  *rolesForTarget(
    targetPath: string
  ): Generator<{ role: string; terminating: boolean }> {
    if (this.roles) {
      for (const role of Object.values(this.roles)) {
        if (role.isDelegatedPath(targetPath)) {
          yield { role: role.name, terminating: role.terminating };
        }
      }
    }
  }

  public toJSON(): JSONObject {
    const json: JSONObject = {
      keys: keysToJSON(this.keys),
      ...this.unrecognizedFields,
    };

    if (this.roles) {
      json.roles = rolesToJSON(this.roles);
    }

    return json;
  }

  public static fromJSON(data: JSONObject): Delegations {
    const { keys, roles, ...unrecognizedFields } = data;

    return new Delegations({
      keys: keysFromJSON(keys),
      roles: rolesFromJSON(roles),
      unrecognizedFields,
    });
  }
}

function keysToJSON(keys: KeyMap): JSONObject {
  return Object.entries(keys).reduce(
    (acc, [keyId, key]) => ({
      ...acc,
      [keyId]: key.toJSON(),
    }),
    {}
  );
}

function rolesToJSON(roles: DelegatedRoleMap): JSONValue {
  return Object.values(roles).map((role) => role.toJSON());
}

function keysFromJSON(data: JSONValue): KeyMap {
  if (!isObjectRecord(data)) {
    throw new TypeError('keys is malformed');
  }

  return Object.entries(data).reduce<KeyMap>(
    (acc, [keyID, keyData]) => ({
      ...acc,
      [keyID]: Key.fromJSON(keyID, keyData),
    }),
    {}
  );
}

function rolesFromJSON(data: JSONValue): DelegatedRoleMap | undefined {
  let roleMap;
  if (isDefined(data)) {
    if (!isObjectArray(data)) {
      throw new TypeError('roles is malformed');
    }

    roleMap = data.reduce<DelegatedRoleMap>((acc, role) => {
      const delegatedRole = DelegatedRole.fromJSON(role);
      return {
        ...acc,
        [delegatedRole.name]: delegatedRole,
      };
    }, {});
  }
  return roleMap;
}
