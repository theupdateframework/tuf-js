import { JSONObject } from '../utils/type';
import { Signed, SignedOptions } from './base';
import { MetadataKind } from './constants';
import { Key } from './key';
import { Role } from './role';

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
    const { keys, roles, consistent_snapshot, ...rest } =
      unrecognizedFields as any;

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
