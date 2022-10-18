import util from 'util';
import { isDefined, isObjectRecord } from '../utils/guard';
import { Signed, SignedOptions } from './base';
import { MetaFile } from './file';
import { JSONObject, MetadataKind } from './types';

type MetaFileMap = Record<string, MetaFile>;

export interface SnapshotOptions extends SignedOptions {
  meta?: MetaFileMap;
}

export class Snapshot extends Signed {
  readonly type = MetadataKind.Snapshot;
  readonly meta: MetaFileMap;

  constructor(opts: SnapshotOptions) {
    super(opts);
    this.meta = opts.meta || { 'targets.json': new MetaFile({ version: 1 }) };
  }

  public equals(other: Snapshot): boolean {
    if (!(other instanceof Snapshot)) {
      return false;
    }

    return super.equals(other) && util.isDeepStrictEqual(this.meta, other.meta);
  }

  public toJSON(): JSONObject {
    return {
      meta: Object.entries(this.meta).reduce(
        (acc, [path, meta]) => ({
          ...acc,
          [path]: meta.toJSON(),
        }),
        {}
      ),
      spec_version: this.specVersion,
      version: this.version,
      expires: this.expires,
      ...this.unrecognizedFields,
    };
  }

  public static fromJSON(data: JSONObject): Snapshot {
    const { unrecognizedFields, ...commonFields } =
      Signed.commonFieldsFromJSON(data);
    const { meta, ...rest } = unrecognizedFields as { meta: JSONObject };

    let metaMap;
    if (isDefined(meta)) {
      if (!isObjectRecord(meta)) {
        throw new TypeError('meta field is malformed');
      } else {
        metaMap = Object.entries(meta).reduce<MetaFileMap>(
          (acc, [path, metadata]) => ({
            ...acc,
            [path]: MetaFile.fromJSON(metadata),
          }),
          {}
        );
      }
    }

    return new Snapshot({
      ...commonFields,
      meta: metaMap,
      unrecognizedFields: rest,
    });
  }
}
