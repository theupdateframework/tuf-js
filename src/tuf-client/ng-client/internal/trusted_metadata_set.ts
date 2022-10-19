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
    const newRoot = Metadata.fromJSON(MetadataKind.Root, data);
    if (newRoot.signed.type != MetadataKind.Root) {
      throw new Error(`Expected 'root', got ${newRoot.signed.type}`);
    }

    if (!this.trustedSet.root) {
      throw new Error('No trusted root metadata');
    }

    this.trustedSet.root.verifyDelegate(MetadataKind.Root, newRoot);

    if (newRoot.signed.version != this.trustedSet.root.signed.version + 1) {
      throw new Error(
        `Expected version ${this.trustedSet.root.signed.version + 1}, got ${
          newRoot.signed.version
        }`
      );
    }

    newRoot.verifyDelegate(MetadataKind.Root, newRoot);

    this.trustedSet.root = newRoot;
    return newRoot;
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
