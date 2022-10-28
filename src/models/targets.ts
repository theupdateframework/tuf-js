import util from 'util';
import { isDefined, isObject, isObjectRecord } from '../utils/guard';
import { JSONObject, JSONValue, MetadataKind } from '../utils/types';
import { Signed, SignedOptions } from './base';
import { Delegations } from './delegations';
import { TargetFile } from './file';

type TargetFileMap = Record<string, TargetFile>;

interface TargetsOptions extends SignedOptions {
  targets?: TargetFileMap;
  delegations?: Delegations;
}

// Container for the signed part of targets metadata.
//
// Targets contains verifying information about target files and also delegates
// responsible to other Targets roles.
export class Targets extends Signed {
  readonly type = MetadataKind.Targets;
  readonly targets: TargetFileMap;
  readonly delegations?: Delegations;

  constructor(options: TargetsOptions) {
    super(options);

    this.targets = options.targets || {};
    this.delegations = options.delegations;
  }

  public equals(other: Targets): boolean {
    if (!(other instanceof Targets)) {
      return false;
    }

    return (
      super.equals(other) &&
      util.isDeepStrictEqual(this.targets, other.targets) &&
      util.isDeepStrictEqual(this.delegations, other.delegations)
    );
  }

  public toJSON(): JSONObject {
    const json: JSONObject = {
      spec_version: this.specVersion,
      version: this.version,
      expires: this.expires,
      targets: targetsToJSON(this.targets),
      ...this.unrecognizedFields,
    };

    if (this.delegations) {
      json.delegations = this.delegations.toJSON();
    }

    return json;
  }

  public static fromJSON(data: JSONObject): Targets {
    const { unrecognizedFields, ...commonFields } =
      Signed.commonFieldsFromJSON(data);
    const { targets, delegations, ...rest } = unrecognizedFields as {
      targets: JSONValue;
      delegations: JSONValue;
    };

    return new Targets({
      ...commonFields,
      targets: targetsFromJSON(targets),
      delegations: delegationsFromJSON(delegations),
      unrecognizedFields: rest,
    });
  }
}

function targetsToJSON(targets: TargetFileMap): JSONObject {
  return Object.entries(targets).reduce(
    (acc, [path, target]) => ({
      ...acc,
      [path]: target.toJSON(),
    }),
    {}
  );
}

function targetsFromJSON(data: JSONValue): TargetFileMap | undefined {
  let targets: TargetFileMap | undefined;

  if (isDefined(data)) {
    if (!isObjectRecord(data)) {
      throw new TypeError('targets must be an object');
    } else {
      targets = Object.entries(data).reduce<TargetFileMap>(
        (acc, [path, target]) => ({
          ...acc,
          [path]: TargetFile.fromJSON(path, target),
        }),
        {}
      );
    }
  }

  return targets;
}

function delegationsFromJSON(data: JSONValue): Delegations | undefined {
  let delegations: Delegations | undefined;

  if (isDefined(data)) {
    if (!isObject(data)) {
      throw new TypeError('delegations must be an object');
    } else {
      delegations = Delegations.fromJSON(data);
    }
  }

  return delegations;
}
