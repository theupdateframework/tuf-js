import { Metadata, Root, Snapshot, Targets, Timestamp } from './models';
import { MetadataKind } from './utils/types';

type TrustedSet = {
  root?: Metadata<Root>;
  timestamp?: Metadata<Timestamp>;
  snapshot?: Metadata<Snapshot>;
  targets?: Metadata<Targets>;
} & { [key: string]: Metadata<Targets> };

export class TrustedMetadataSet {
  private trustedSet: TrustedSet = {};
  private referenceTime: Date;

  constructor(rootData: Buffer) {
    this.referenceTime = new Date();
    this.loadTrustedRoot(rootData);
  }

  public get root(): Metadata<Root> {
    if (!this.trustedSet.root) {
      throw new Error('No trusted root metadata');
    }
    return this.trustedSet.root;
  }

  public get timestamp(): Metadata<Timestamp> | undefined {
    return this.trustedSet.timestamp;
  }

  public get snapshot(): Metadata<Snapshot> | undefined {
    return this.trustedSet.snapshot;
  }

  public get targets(): Metadata<Targets> | undefined {
    return this.trustedSet.targets;
  }

  public getRole(name: string): Metadata<Targets> | undefined {
    return this.trustedSet[name];
  }

  public updateRoot(bytesBuffer: Buffer): Metadata<Root> {
    const data = JSON.parse(bytesBuffer.toString('utf8'));
    const newRoot = Metadata.fromJSON(MetadataKind.Root, data);
    if (newRoot.signed.type != MetadataKind.Root) {
      throw new Error(`Expected 'root', got ${newRoot.signed.type}`);
    }

    this.root.verifyDelegate(MetadataKind.Root, newRoot);

    if (newRoot.signed.version != this.root.signed.version + 1) {
      throw new Error(
        `Expected version ${this.root.signed.version + 1}, got ${
          newRoot.signed.version
        }`
      );
    }

    newRoot.verifyDelegate(MetadataKind.Root, newRoot);

    this.trustedSet.root = newRoot;
    return newRoot;
  }

  public updateTimestamp(bytesBuffer: Buffer): Metadata<Timestamp> {
    if (this.snapshot) {
      throw new Error('Cannot update timestamp after snapshot');
    }

    if (this.root.signed.isExpired(this.referenceTime)) {
      throw new Error('Final root.json is expiredt');
    }

    const data = JSON.parse(bytesBuffer.toString('utf8'));
    const newTimestamp = Metadata.fromJSON(MetadataKind.Timestamp, data);

    if (newTimestamp.signed.type != MetadataKind.Timestamp) {
      throw new Error(`Expected 'timestamp', got ${newTimestamp.signed.type}`);
    }

    this.root.verifyDelegate(MetadataKind.Timestamp, newTimestamp);

    if (this.timestamp) {
      // Prevent rolling back timestamp version
      if (newTimestamp.signed.version < this.timestamp.signed.version) {
        throw new Error(
          `New timestamp version ${newTimestamp.signed.version} is less than current version ${this.timestamp.signed.version}`
        );
      }
      //  Keep using old timestamp if versions are equal.
      if (newTimestamp.signed.version === this.timestamp.signed.version) {
        throw new Error(
          `New timestamp version ${newTimestamp.signed.version} is equal to current version ${this.timestamp.signed.version}`
        );
      }
      // Prevent rolling back snapshot version
      const snapshotMeta = this.timestamp.signed.snapshotMeta;
      const newSnapshotMeta = newTimestamp.signed.snapshotMeta;
      if (newSnapshotMeta.version < snapshotMeta.version) {
        throw new Error(
          `New snapshot version ${newSnapshotMeta.version} is less than current version ${snapshotMeta.version}`
        );
      }
    }

    // expiry not checked to allow old timestamp to be used for rollback
    // protection of new timestamp: expiry is checked in update_snapshot()

    this.trustedSet.timestamp = newTimestamp;
    this.checkFinalTimestamp();

    return newTimestamp;
  }

  public updateSnapshot(
    bytesBuffer: Buffer,
    trusted = false
  ): Metadata<Snapshot> {
    if (!this.timestamp) {
      throw new Error('Cannot update snapshot before timestamp');
    }
    if (this.targets) {
      throw new Error('Cannot update snapshot after targets');
    }

    // Snapshot cannot be loaded if final timestamp is expired
    this.checkFinalTimestamp();

    const snapshotMeta = this.timestamp.signed.snapshotMeta;

    // Verify non-trusted data against the hashes in timestamp, if any.
    // Trusted snapshot data has already been verified once.
    if (!trusted) {
      snapshotMeta.verify(bytesBuffer);
    }

    const data = JSON.parse(bytesBuffer.toString('utf8'));
    const newSnapshot = Metadata.fromJSON(MetadataKind.Snapshot, data);

    if (newSnapshot.signed.type != MetadataKind.Snapshot) {
      throw new Error(`Expected 'snapshot', got ${newSnapshot.signed.type}`);
    }

    this.root.verifyDelegate(MetadataKind.Snapshot, newSnapshot);

    // version not checked against meta version to allow old snapshot to be
    // used in rollback protection: it is checked when targets is updated

    // If an existing trusted snapshot is updated, check for rollback attack

    if (this.snapshot) {
      Object.entries(this.snapshot.signed.meta).forEach(
        ([fileName, fileInfo]) => {
          const newFileInfo = newSnapshot.signed.meta[fileName];
          if (!newFileInfo) {
            throw new Error(`Missing file ${fileName} in new snapshot`);
          }
          if (newFileInfo.version < fileInfo.version) {
            throw new Error(
              `New version ${newFileInfo.version} of ${fileName} is less than current version ${fileInfo.version}`
            );
          }
        }
      );
    }

    // expiry not checked to allow old snapshot to be used for rollback
    // protection of new snapshot: it is checked when targets is updated

    this.trustedSet.snapshot = newSnapshot;
    console.log('Updated snapshot v%s', newSnapshot.signed.version);

    // snapshot is loaded, but we raise if it's not valid _final_ snapshot
    this.checkFinalSnapsnot();

    return newSnapshot;
  }

  private checkFinalTimestamp() {
    if (!this.timestamp) {
      throw new Error('No trusted timestamp metadata');
    }
    if (this.timestamp.signed.isExpired(this.referenceTime)) {
      throw new Error('Final timestamp.json is expired');
    }
  }

  private checkFinalSnapsnot() {
    // Raise if snapshot is expired or meta version does not match
    if (!this.snapshot) {
      throw new Error('No trusted snapshot metadata');
    }
    if (!this.timestamp) {
      throw new Error('No trusted timestamp metadata');
    }

    if (this.snapshot.signed.isExpired(this.referenceTime)) {
      throw new Error('snapshot.json is expired');
    }

    const snapshotMeta = this.timestamp.signed.snapshotMeta;

    if (this.snapshot.signed.version !== snapshotMeta.version) {
      throw new Error("Snapshot version doesn't match timestamp");
    }
  }

  public updateDelegatedTargets(
    bytesBuffer: Buffer,
    roleName: string,
    delegatorName: string
  ) {
    if (!this.snapshot) {
      throw new Error('Cannot update delegated targets before snapshot');
    }

    // Targets cannot be loaded if final snapshot is expired or its version
    // does not match meta version in timestamp
    this.checkFinalSnapsnot();

    const delegator = this.trustedSet[delegatorName];

    if (!delegator) {
      throw new Error(`No trusted ${delegatorName} metadata`);
    }

    console.log('Updating %s delegated by %s', roleName, delegatorName);

    // Verify against the hashes in snapshot, if any
    const meta = this.snapshot.signed.meta?.[`${roleName}.json`];
    if (!meta) {
      throw new Error(`Missing ${roleName}.json in snapshot`);
    }

    meta.verify(bytesBuffer);

    const data = JSON.parse(bytesBuffer.toString('utf8'));
    const newDelegate = Metadata.fromJSON(MetadataKind.Targets, data);

    if (newDelegate.signed.type != MetadataKind.Targets) {
      throw new Error(`Expected 'targets', got ${newDelegate.signed.type}`);
    }

    delegator.verifyDelegate(roleName, newDelegate);

    const version = newDelegate.signed.version;
    if (version != meta.version) {
      throw new Error(
        `Version ${version} of ${roleName} does not match snapshot version ${meta.version}`
      );
    }

    if (newDelegate.signed.isExpired(this.referenceTime)) {
      throw new Error(`${roleName}.json is expired`);
    }

    this.trustedSet[roleName] = newDelegate;
    console.log('Updated %s v%s', roleName, version);
  }

  // Verifies and loads data as trusted root metadata.
  // Note that an expired initial root is still considered valid.
  private loadTrustedRoot(bytesBuffer: Buffer) {
    const data = JSON.parse(bytesBuffer.toString('utf8'));
    const root = Metadata.fromJSON(MetadataKind.Root, data);

    if (root.signed.type != MetadataKind.Root) {
      throw new Error(`Expected 'root', got ${root.signed.type}`);
    }
    root.verifyDelegate(MetadataKind.Root, root);

    this.trustedSet['root'] = root;
    console.info('Loaded trusted root v%d', root.signed.version);
  }
}
