import crypto from 'crypto';
import minimatch from 'minimatch';
import util from 'util';
import { ValueError } from '../error';
import { isDefined, isStringArray } from '../utils/guard';
import { JSONObject, JSONValue } from '../utils/types';

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
      throw new ValueError('duplicate key IDs found');
    }

    if (threshold < 1) {
      throw new ValueError('threshold must be at least 1');
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

interface SuccinctRolesOption extends RoleOptions {
  bitLength: number;
  namePrefix: string;
}

export class SuccinctRoles extends Role {
  readonly bitLength: number;
  readonly namePrefix: string;
  readonly numberOfBins: number;
  readonly suffixLen: number;

  constructor(opts: SuccinctRolesOption) {
    super(opts);
    const { bitLength, namePrefix } = opts;

    if (bitLength <= 0 || bitLength > 32) {
      throw new ValueError('bitLength must be between 1 and 32');
    }

    this.bitLength = bitLength;
    this.namePrefix = namePrefix;
    this.numberOfBins = Math.pow(2, bitLength);
    this.suffixLen = (this.numberOfBins - 1).toString(16).length;
  }

  public equals(other: SuccinctRoles): boolean {
    if (!(other instanceof SuccinctRoles)) {
      return false;
    }

    return (
      super.equals(other) &&
      this.bitLength === other.bitLength &&
      this.namePrefix === other.namePrefix
    );
  }

  public getRoleForTarget(targetFilepath: string): string {
    const hasher = crypto.createHash('sha256');
    const hasherBuffer = hasher.update(targetFilepath).digest();

    const hashBytes = hasherBuffer.subarray(0, 4);

    const shiftValue = 32 - this.bitLength;

    const binNumber = parseInt(hashBytes.toString('hex'), 16) >>> shiftValue;

    const suffix = binNumber.toString(16).padStart(this.suffixLen, '0');

    return `${this.namePrefix}-${suffix}`;
  }

  *getRoles(): Generator<string> {
    for (let i = 0; i < this.numberOfBins; i++) {
      const suffix = i.toString(16).padStart(this.suffixLen, '0');
      yield `${this.namePrefix}-${suffix}`;
    }
  }

  public isDelegatedRole(roleName: string): boolean {
    const desiredPrefix = this.namePrefix + '-';

    if (!roleName.startsWith(desiredPrefix)) {
      return false;
    }
    const suffix = roleName.slice(desiredPrefix.length, roleName.length);
    if (suffix.length != this.suffixLen) {
      return false;
    }

    // make sure the suffix is a hex string
    if (!suffix.match(/^[0-9a-fA-F]+$/)) {
      return false;
    }

    try {
      var num = parseInt(suffix, 16);
    } catch (e) {
      return false;
    }
    return 0 <= num && num < this.numberOfBins;
  }

  public toJSON(): JSONObject {
    const json: JSONObject = {
      ...super.toJSON(),
      bitLength: this.bitLength,
      namePrefix: this.namePrefix,
      numberOfBins: this.numberOfBins,
      suffixLen: this.suffixLen,
    };

    return json;
  }

  public static fromJSON(data: JSONObject): SuccinctRoles {
    const { keyids, threshold, bit_length, name_prefix, ...rest } = data;

    if (!isStringArray(keyids)) {
      throw new TypeError('keyids must be an array of strings');
    }

    if (typeof threshold !== 'number') {
      throw new TypeError('threshold must be a number');
    }

    if (typeof bit_length !== 'number') {
      throw new TypeError('bit_length must be a number');
    }

    if (typeof name_prefix !== 'string') {
      throw new TypeError('name_prefix must be a string');
    }

    return new SuccinctRoles({
      keyIDs: keyids,
      threshold,
      bitLength: bit_length,
      namePrefix: name_prefix,
      unrecognizedFields: rest,
    });
  }
}
