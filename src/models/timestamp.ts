import { isDefined, isObject } from '../utils/guard';
import { JSONObject, MetadataKind } from '../utils/types';
import { Signed, SignedOptions } from './base';
import { MetaFile } from './file';

interface TimestampOptions extends SignedOptions {
  snapshotMeta?: MetaFile;
}

/**
 * A container for the signed part of timestamp metadata.
 */
export class Timestamp extends Signed {
  readonly type = MetadataKind.Timestamp;
  readonly snapshotMeta: MetaFile;

  constructor(options: TimestampOptions) {
    super(options);
    this.snapshotMeta = options.snapshotMeta || new MetaFile({ version: 1 });
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

    return new Timestamp({
      ...commonFields,
      snapshotMeta: snapshotMetaFromJSON(meta),
      unrecognizedFields: rest,
    });
  }
}

function snapshotMetaFromJSON(data: JSONObject): MetaFile | undefined {
  let snapshotMeta: MetaFile | undefined;

  if (isDefined(data)) {
    const snapshotData = data['snapshot.json'];

    if (!isDefined(snapshotData) || !isObject(snapshotData)) {
      throw new TypeError('missing snapshot.json in meta');
    } else {
      snapshotMeta = MetaFile.fromJSON(snapshotData);
    }
  }

  return snapshotMeta;
}
