import { isDefined, isObjectRecord } from '../utils/guard';
import { JSONObject, JSONValue } from '../utils/type';
import { Signed, SignedOptions } from './base';
import { MetadataKind } from './constants';
import { Key } from './key';
import { Role } from './role';

type KeyMap = Record<string, Key>;
type RoleMap = Record<string, Role>;

export type RootOptions = SignedOptions & {
  keys?: Record<string, Key>;
  roles?: Record<string, Role>;
  consistentSnapshot: boolean;
};

const TOP_LEVEL_ROLE_NAMES = [
  MetadataKind.Root,
  MetadataKind.Timestamp,
  MetadataKind.Snapshot,
  MetadataKind.Targets,
];

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
      this.roles = TOP_LEVEL_ROLE_NAMES.reduce<RoleMap>((acc, role) => {
        acc[role] = new Role({ keyIDs: [], threshold: 1 });
        return acc;
      }, {});
    } else {
      const roleNames = new Set(Object.keys(options.roles));
      if (!TOP_LEVEL_ROLE_NAMES.every((role) => roleNames.has(role))) {
        throw new Error('Missing top-level role');
      }

      this.roles = options.roles;
    }
  }

  public toJSON(): JSONObject {
    return {
      spec_version: this.specVersion,
      version: this.version,
      expires: this.expires,
      keys: Object.entries(this.keys).reduce(
        (prev, [keyID, key]) => ({ ...prev, [keyID]: key.toJSON() }),
        {}
      ),
      roles: Object.entries(this.roles).reduce(
        (prev, [roleName, role]) => ({
          ...prev,
          [roleName]: role.toJSON(),
        }),
        {}
      ),
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
      throw new TypeError('consistent_snapshot is not a boolean');
    }

    let keyMap: KeyMap | undefined;
    if (isDefined(keys)) {
      if (!isObjectRecord(keys)) {
        throw new TypeError('keys is not malformed');
      } else {
        keyMap = Object.entries(keys).reduce<KeyMap>(
          (acc, [keyID, keyData]) => ({
            ...acc,
            [keyID]: Key.fromJSON(keyID, keyData),
          }),
          {}
        );
      }
    }

    let roleMap: RoleMap | undefined;
    if (isDefined(roles)) {
      if (!isObjectRecord(roles)) {
        throw new TypeError('roles is not malformed');
      } else {
        roleMap = Object.entries(roles).reduce<RoleMap>(
          (acc, [roleName, roleData]) => ({
            ...acc,
            [roleName]: Role.fromJSON(roleData),
          }),
          {}
        );
      }
    }

    return new Root({
      ...commonFields,
      keys: keyMap,
      roles: roleMap,
      consistentSnapshot: consistent_snapshot,
      unrecognizedFields: rest,
    });
  }
}
