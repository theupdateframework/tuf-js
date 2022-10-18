import crypto from 'crypto';
import minimatch from 'minimatch';
import util from 'util';
import { isDefined, isStringArray } from '../utils/guard';
import { ValueError } from './error';
import { JSONObject, JSONValue } from './types';

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

interface DelegatedRoleOptions extends RoleOptions {
  name: string;
  terminating: boolean;
  paths?: string[];
  pathHashPrefixes?: string[];
}

export class DelegatedRole extends Role {
  readonly name: string;
  readonly terminating: boolean;
  readonly paths?: string[];
  readonly pathHashPrefixes?: string[];

  constructor(opts: DelegatedRoleOptions) {
    super(opts);
    const { name, terminating, paths, pathHashPrefixes } = opts;

    this.name = name;
    this.terminating = terminating;

    if (opts.paths && opts.pathHashPrefixes) {
      throw new ValueError('paths and pathHashPrefixes are mutually exclusive');
    }

    this.paths = paths;
    this.pathHashPrefixes = pathHashPrefixes;
  }

  public equals(other: DelegatedRole): boolean {
    if (!(other instanceof DelegatedRole)) {
      return false;
    }

    return (
      super.equals(other) &&
      this.name === other.name &&
      this.terminating === other.terminating &&
      util.isDeepStrictEqual(this.paths, other.paths) &&
      util.isDeepStrictEqual(this.pathHashPrefixes, other.pathHashPrefixes)
    );
  }

  public isDelegatedPath(targetFilepath: string): boolean {
    if (this.paths) {
      return this.paths.some((pathPattern) =>
        isTargetInPathPattern(targetFilepath, pathPattern)
      );
    }

    if (this.pathHashPrefixes) {
      const hasher = crypto.createHash('sha256');
      const pathHash = hasher.update(targetFilepath).digest('hex');
      return this.pathHashPrefixes.some((pathHashPrefix) =>
        pathHash.startsWith(pathHashPrefix)
      );
    }

    return false;
  }

  public toJSON(): JSONObject {
    const json: JSONObject = {
      ...super.toJSON(),
      name: this.name,
      terminating: this.terminating,
    };

    if (this.paths) {
      json.paths = this.paths;
    }

    if (this.pathHashPrefixes) {
      json.path_hash_prefixes = this.pathHashPrefixes;
    }

    return json;
  }

  public static fromJSON(data: JSONObject): DelegatedRole {
    const {
      keyids,
      threshold,
      name,
      terminating,
      paths,
      path_hash_prefixes,
      ...rest
    } = data;

    if (!isStringArray(keyids)) {
      throw new TypeError('keyids must be an array of strings');
    }

    if (typeof threshold !== 'number') {
      throw new TypeError('threshold must be a number');
    }

    if (typeof name !== 'string') {
      throw new TypeError('name must be a string');
    }

    if (typeof terminating !== 'boolean') {
      throw new TypeError('terminating must be a boolean');
    }

    if (isDefined(paths) && !isStringArray(paths)) {
      throw new TypeError('paths must be an array of strings');
    }

    if (isDefined(path_hash_prefixes) && !isStringArray(path_hash_prefixes)) {
      throw new TypeError('path_hash_prefixes must be an array of strings');
    }

    return new DelegatedRole({
      keyIDs: keyids,
      threshold,
      name,
      terminating,
      paths,
      pathHashPrefixes: path_hash_prefixes,
      unrecognizedFields: rest,
    });
  }
}

// JS version of Ruby's Array#zip
const zip = (a: string[], b: string[]) => a.map((k, i) => [k, b[i]]);

function isTargetInPathPattern(target: string, pattern: string): boolean {
  const targetParts = target.split('/');
  const patternParts = pattern.split('/');

  if (patternParts.length != targetParts.length) {
    return false;
  }

  return zip(targetParts, patternParts).every(([targetPart, patternPart]) =>
    minimatch(targetPart, patternPart)
  );
}
