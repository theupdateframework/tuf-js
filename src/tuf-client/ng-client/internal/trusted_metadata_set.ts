import {
  Metadata,
  Root,
  Targets,
  Snapshot,
  Timestamp,
  MetadataKind,
} from '../../api';
import { JSONObject } from '../../api/types';

interface TrustedSet {
  root?: Metadata<Root>;
  timestamp?: Metadata<Timestamp>;
  snapshot?: Metadata<Snapshot>;
  targets?: Metadata<Targets>;
}

export class TrustedMetadataSet {
  public readonly trustedSet: TrustedSet = {};
  public readonly referenceTime: number;

  constructor(rootData: JSONObject) {
    this.referenceTime = new Date().getTime();
    this.loadTrustedRoot(rootData);
  }

  public updateRoot(data: JSONObject): Metadata<Root> {
    const root = Metadata.fromJSON(MetadataKind.Root, data);
    if (root.signed.type != MetadataKind.Root) {
      throw new Error(`Expected 'root', got ${root.signed.type}`);
    }
    this.trustedSet.root?.verifyDelegate(MetadataKind.Root, root);
    root.verifyDelegate(MetadataKind.Root, root);

    this.trustedSet.root = root;
    return root;
  }

  // Verifies and loads data as trusted root metadata.
  // Note that an expired initial root is still considered valid.
  private loadTrustedRoot(data: JSONObject) {
    const root = Metadata.fromJSON(MetadataKind.Root, data);

    if (root.signed.type != MetadataKind.Root) {
      throw new Error(`Expected 'root', got ${root.signed.type}`);
    }
    root.verifyDelegate(MetadataKind.Root, root);

    this.trustedSet['root'] = root;
    console.info('Loaded trusted root v%d', root.signed.version);
  }
}
