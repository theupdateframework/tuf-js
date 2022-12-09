import util from 'util';
import { ValueError } from '../error';
import {
  isDefined,
  isObject,
  isObjectArray,
  isObjectRecord,
} from '../utils/guard';
import { JSONObject, JSONValue } from '../utils/types';
import { Key } from './key';
import { DelegatedRole, SuccinctRoles, TOP_LEVEL_ROLE_NAMES } from './role';

type DelegatedRoleMap = Record<string, DelegatedRole>;
type KeyMap = Record<string, Key>;

interface DelegationsOptions {
  keys: KeyMap;
  roles?: DelegatedRoleMap;
  succinct_roles?: SuccinctRoles;
  unrecognizedFields?: Record<string, JSONValue>;
}

export class Delegations {
  readonly keys: KeyMap;
  readonly roles?: DelegatedRoleMap;
  readonly unrecognizedFields?: Record<string, JSONValue>;
  readonly succinct_roles?: SuccinctRoles;

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

    this.succinct_roles = options.succinct_roles;

    this.roles = options.roles;
  }

  public equals(other: Delegations): boolean {
    if (!(other instanceof Delegations)) {
      return false;
    }

    return (
      util.isDeepStrictEqual(this.keys, other.keys) &&
      util.isDeepStrictEqual(this.roles, other.roles) &&
      util.isDeepStrictEqual(
        this.unrecognizedFields,
        other.unrecognizedFields
      ) &&
      util.isDeepStrictEqual(this.succinct_roles, other.succinct_roles)
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
    } else if (this.succinct_roles) {
      yield {
        role: this.succinct_roles.getRoleForTarget(targetPath),
        terminating: true,
      };
    }
  }

  public toJSON(): JSONObject {
    const json: JSONObject = {
      keys: keysToJSON(this.keys),
      ...this.unrecognizedFields,
    };

    if (this.roles) {
      json.roles = rolesToJSON(this.roles);
    } else if (this.succinct_roles) {
      json.succinct_roles = this.succinct_roles.toJSON();
    }

    return json;
  }

  public static fromJSON(data: JSONObject): Delegations {
    const { keys, roles, succinct_roles, ...unrecognizedFields } = data;

    if (isObject(succinct_roles)) {
      return new Delegations({
        keys: keysFromJSON(keys),
        roles: rolesFromJSON(roles),
        succinct_roles: SuccinctRoles.fromJSON(succinct_roles),
        unrecognizedFields,
      });
    }

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
