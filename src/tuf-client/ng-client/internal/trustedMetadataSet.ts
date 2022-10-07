import {
  Metadata,
  Snapshot,
  Root,
  Timestamp,
  Targets,
} from '../../api/metadata';
import { JSONValue } from '../../utils/type';

export class TrustedMetadataSet {
  private trustedSet: Record<
    string,
    | Metadata<Root>
    | Metadata<Timestamp>
    | Metadata<Snapshot>
    | Metadata<Targets>
  >;
  private referenceTime: number;

  constructor(rootData: JSONValue) {
    this.trustedSet = {};
    this.referenceTime = new Date().getUTCMilliseconds();
    this.loadTrustedRoot(rootData);
  }

  private loadTrustedRoot(data: JSONValue) {
    // Verifies and loads ``data`` as trusted root metadata.
    // Note that an expired initial root is considered valid: expiry is
    // only checked for the final root in ``update_timestamp()``.

    const rootData = new Root().fromJSON(data?.signed);
    const rootMetaData = new Metadata<Root>(rootData);

    if (rootMetaData?.signed?.type != new Root().type) {
      throw new Error(`Expected 'root', got ${rootMetaData?.signed?.type}`);
    }
    rootMetaData.verifyDelegate();

    this.trustedSet[new Root().type] = rootMetaData;
    console.info('Loaded trusted root v%d', rootMetaData.signed.version);
  }
}
