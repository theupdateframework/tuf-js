import util from 'util';
import { isStringArray } from '../utils/guard';
import { JSONObject, JSONValue } from '../utils/type';
import { ValueError } from './error';

export const TOP_LEVEL_ROLE_NAMES = [
  'root',
  'targets',
  'snapshot',
  'timestamp',
];

export interface RoleOptions {
  keyIDs: string[];
  threshold: number;
  unrecognizedFields?: Record<string, JSONValue>;
}

export class Role {
  readonly keyIDs: string[];
  readonly threshold: number;
  readonly unrecognizedFields?: Record<string, JSONValue>;

  constructor(options: RoleOptions) {
    const { keyIDs, threshold, unrecognizedFields } = options;

    if (hasDuplicates(keyIDs)) {
      throw new ValueError('Duplicate key IDs found');
    }

    if (threshold < 1) {
      throw new ValueError('Threshold must be at least 1');
    }

    this.keyIDs = keyIDs;
    this.threshold = threshold;
    this.unrecognizedFields = unrecognizedFields || {};
  }

  public equals(other: Role): boolean {
    if (!(other instanceof Role)) {
      return false;
    }

    return (
      this.threshold === other.threshold &&
      util.isDeepStrictEqual(this.keyIDs, other.keyIDs) &&
      util.isDeepStrictEqual(this.unrecognizedFields, other.unrecognizedFields)
    );
  }

  public toJSON(): JSONObject {
    return {
      keyids: this.keyIDs,
      threshold: this.threshold,
      ...this.unrecognizedFields,
    };
  }

  public static fromJSON(data: JSONObject): Role {
    const { keyids, threshold, ...rest } = data;

    if (!isStringArray(keyids)) {
      throw new TypeError('keyids must be an array');
    }

    if (typeof threshold !== 'number') {
      throw new TypeError('threshold must be a number');
    }

    return new Role({
      keyIDs: keyids,
      threshold,
      unrecognizedFields: rest,
    });
  }
}

function hasDuplicates(array: string[]) {
  return new Set(array).size !== array.length;
}
