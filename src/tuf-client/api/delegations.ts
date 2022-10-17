import util from 'util';
import { isDefined, isObjectArray, isObjectRecord } from '../utils/guard';
import { JSONObject, JSONValue } from '../utils/type';
import { DelegatedRole } from './delegated_role';
import { ValueError } from './error';
import { Key } from './key';
import { TOP_LEVEL_ROLE_NAMES } from './role';

type DelegatedRoleMap = Record<string, DelegatedRole>;

interface DelegationsOptions {
  keys: Record<string, Key>;
  roles?: DelegatedRoleMap;
  unrecognizedFields?: Record<string, JSONValue>;
}

export class Delegations {
  readonly keys: Record<string, Key>;
  readonly roles?: DelegatedRoleMap;
  readonly unrecognizedFields?: Record<string, JSONValue>;

  constructor(options: DelegationsOptions) {
    this.keys = options.keys;
    this.unrecognizedFields = options.unrecognizedFields || {};

    if (options.roles) {
      Object.keys(options.roles).forEach((roleName) => {
        if (!TOP_LEVEL_ROLE_NAMES.includes(roleName)) {
          throw new ValueError(`Invalid role name ${roleName}`);
        }
      });
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
    const keys = Object.entries(this.keys).reduce(
      (acc, [keyId, key]) => ({
        ...acc,
        [keyId]: key.toJSON(),
      }),
      {}
    );

    const json: JSONObject = {
      keys,
      ...this.unrecognizedFields,
    };

    if (this.roles) {
      json.roles = Object.values(this.roles).map((role) => role.toJSON());
    }

    return json;
  }

  public static fromJSON(data: JSONObject): Delegations {
    const { keys, roles, ...unrecognizedFields } = data;

    // Collect keys
    if (!isObjectRecord(keys)) {
      throw new TypeError('keys is malformed');
    }

    const keyMap = Object.entries(keys).reduce<Record<string, Key>>(
      (acc, [keyID, keyData]) => ({
        ...acc,
        [keyID]: Key.fromJSON(keyID, keyData),
      }),
      {}
    );

    // Collect roles
    let roleMap;
    if (isDefined(roles)) {
      if (!isObjectArray(roles)) {
        throw new TypeError('roles is malformed');
      }

      roleMap = roles.reduce<DelegatedRoleMap>((acc, role) => {
        const delegatedRole = DelegatedRole.fromJSON(role);
        return {
          ...acc,
          [delegatedRole.name]: delegatedRole,
        };
      }, {});
    }

    return new Delegations({
      keys: keyMap,
      roles: roleMap,
      unrecognizedFields,
    });
  }
}
