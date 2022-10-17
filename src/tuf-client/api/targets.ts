import util from 'util';
import { isDefined, isObject, isObjectRecord } from '../utils/guard';
import { JSONObject, JSONValue } from '../utils/type';
import { Signed, SignedOptions } from './base';
import { MetadataKind } from './constants';
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
    const targets = Object.entries(this.targets).reduce(
      (acc, [path, target]) => ({
        ...acc,
        [path]: target.toJSON(),
      }),
      {}
    );

    const json: JSONObject = {
      spec_version: this.specVersion,
      version: this.version,
      expires: this.expires,
      targets,
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

    let targetMap: TargetFileMap | undefined;
    if (isDefined(targets)) {
      if (!isObjectRecord(targets)) {
        throw new TypeError('targets is malformed');
      } else {
        targetMap = Object.entries(targets).reduce<TargetFileMap>(
          (acc, [path, target]) => ({
            ...acc,
            [path]: TargetFile.fromJSON(path, target),
          }),
          {}
        );
      }
    }

    let delegationsMap: Delegations | undefined;
    if (isDefined(delegations)) {
      if (!isObject(delegations)) {
        throw new TypeError('delegations is malformed');
      } else {
        delegationsMap = Delegations.fromJSON(delegations);
      }
    }

    return new Targets({
      ...commonFields,
      targets: targetMap,
      delegations: delegationsMap,
      unrecognizedFields: rest,
    });
  }
}
