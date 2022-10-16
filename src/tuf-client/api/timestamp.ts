import { isDefined, isObject } from '../utils/guard';
import { JSONObject } from '../utils/type';
import { MetadataKind } from './constants';
import { MetaFile } from './file';
import { Signed, SignedOptions } from './base';

interface TimestampOptions extends SignedOptions {
  snapshotMeta?: MetaFile;
}

export class Timestamp extends Signed {
  readonly type = MetadataKind.Timestamp;
  readonly snapshotMeta: MetaFile;

  constructor(opts: TimestampOptions) {
    super(opts);
    this.snapshotMeta = opts.snapshotMeta || new MetaFile({ version: 1 });
  }

  public equals(other: Timestamp): boolean {
    if (!(other instanceof Timestamp)) {
      return false;
    }

    return super.equals(other) && this.snapshotMeta.equals(other.snapshotMeta);
  }

  public toJSON(): JSONObject {
    return {
      spec_version: this.specVersion,
      version: this.version,
      expires: this.expires,
      meta: { 'snapshot.json': this.snapshotMeta.toJSON() },
      ...this.unrecognizedFields,
    };
  }

  public static fromJSON(data: JSONObject): Timestamp {
    const { unrecognizedFields, ...commonFields } =
      Signed.commonFieldsFromJSON(data);
    const { meta, ...rest } = unrecognizedFields as { meta: JSONObject };

    let snapshotMeta: MetaFile | undefined;
    if (isDefined(meta)) {
      const snapshotData = meta['snapshot.json'];

      if (!isDefined(snapshotData) || !isObject(snapshotData)) {
        throw new TypeError('snapshot.json is not defined in meta');
      } else {
        snapshotMeta = MetaFile.fromJSON(snapshotData);
      }
    }

    return new Timestamp({
      ...commonFields,
      snapshotMeta,
      unrecognizedFields: rest,
    });
  }
}
