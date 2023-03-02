import { MetadataKind, Signed, SignedOptions } from './base';
import { MetaFile } from './file';
import { guard, JSONObject } from './utils';

interface TimestampOptions extends SignedOptions {
  snapshotMeta?: MetaFile;
}

/**
 * A container for the signed part of timestamp metadata.
 *
 * A top-level that specifies the latest version of the snapshot role metadata file,
 * and hence the latest versions of all metadata and targets on the repository.
 */
export class Timestamp extends Signed {
  readonly type = MetadataKind.Timestamp;
  readonly snapshotMeta: MetaFile;

  constructor(options: TimestampOptions) {
    super(options);
    this.snapshotMeta = options.snapshotMeta || new MetaFile({ version: 1 });
  }

  public override equals(other: Timestamp): boolean {
    if (!(other instanceof Timestamp)) {
      return false;
    }

    return super.equals(other) && this.snapshotMeta.equals(other.snapshotMeta);
  }

  public toJSON(): JSONObject {
    return {
      _type: this.type,
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

  if (guard.isDefined(data)) {
    const snapshotData = data['snapshot.json'];

    if (!guard.isDefined(snapshotData) || !guard.isObject(snapshotData)) {
      throw new TypeError('missing snapshot.json in meta');
    } else {
      snapshotMeta = MetaFile.fromJSON(snapshotData);
    }
  }

  return snapshotMeta;
}
