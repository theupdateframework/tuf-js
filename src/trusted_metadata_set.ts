import {
  JSONObject,
  Metadata,
  MetadataKind,
  Root,
  Snapshot,
  Targets,
  Timestamp,
} from './models';

interface TrustedSet {
  root?: Metadata<Root>;
  timestamp?: Metadata<Timestamp>;
  snapshot?: Metadata<Snapshot>;
  targets?: Metadata<Targets>;
}

export class TrustedMetadataSet {
  private trustedSet: TrustedSet = {};
  private referenceTime: Date;

  constructor(rootData: JSONObject) {
    this.referenceTime = new Date();
    this.loadTrustedRoot(rootData);
  }

  public hasRoot(): boolean {
    return !!this.trustedSet.root;
  }

  public hasTimestamp(): boolean {
    return !!this.trustedSet.timestamp;
  }

  public hasSnapshot(): boolean {
    return !!this.trustedSet.snapshot;
  }

  public hasTargets(): boolean {
    return !!this.trustedSet.targets;
  }

  public get root(): Metadata<Root> {
    if (!this.trustedSet.root) {
      throw new Error('No trusted root metadata');
    }
    return this.trustedSet.root;
  }

  public get timestamp(): Metadata<Timestamp> {
    if (!this.trustedSet.timestamp) {
      throw new Error('No trusted timestamp metadata');
    }
    return this.trustedSet.timestamp;
  }

  public get snapshot(): Metadata<Snapshot> {
    if (!this.trustedSet.snapshot) {
      throw new Error('No trusted snapshot metadata');
    }
    return this.trustedSet.snapshot;
  }

  public get targets(): Metadata<Targets> {
    if (!this.trustedSet.targets) {
      throw new Error('No trusted targets metadata');
    }
    return this.trustedSet.targets;
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

  public updateTimestamp(data: JSONObject): Metadata<Timestamp> {
    if (this.trustedSet.snapshot) {
      throw new Error('Cannot update timestamp after snapshot');
    }

    if (!this.trustedSet.root) {
      throw new Error('No trusted root metadata');
    }
    if (this.trustedSet.root.signed.isExpired(this.referenceTime)) {
      throw new Error('Final root.json is expiredt');
    }

    const newTimestamp = Metadata.fromJSON(MetadataKind.Timestamp, data);
    if (newTimestamp.signed.type != MetadataKind.Timestamp) {
      throw new Error(`Expected 'timestamp', got ${newTimestamp.signed.type}`);
    }

    this.trustedSet.root.verifyDelegate(MetadataKind.Timestamp, newTimestamp);

    if (this.trustedSet.timestamp) {
      // Prevent rolling back timestamp version
      if (
        newTimestamp.signed.version < this.trustedSet.timestamp.signed.version
      ) {
        throw new Error(
          `New timestamp version ${newTimestamp.signed.version} is less than current version ${this.trustedSet.timestamp.signed.version}`
        );
      }
      //  Keep using old timestamp if versions are equal.
      if (
        newTimestamp.signed.version === this.trustedSet.timestamp.signed.version
      ) {
        throw new Error(
          `New timestamp version ${newTimestamp.signed.version} is equal to current version ${this.trustedSet.timestamp.signed.version}`
        );
      }
      // Prevent rolling back snapshot version
      const snapshotMeta = this.trustedSet.timestamp.signed.snapshotMeta;
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
    trusted?: boolean
  ): Metadata<Snapshot> {
    if (!this.trustedSet.timestamp) {
      throw new Error('Cannot update snapshot before timestamp');
    }
    if (this.trustedSet.targets) {
      throw new Error('Cannot update snapshot after targets');
    }

    // Snapshot cannot be loaded if final timestamp is expired
    this.checkFinalTimestamp();

    const snapshotMeta = this.trustedSet.timestamp.signed.snapshotMeta;

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

    if (!this.trustedSet.root) {
      throw new Error('No trusted root metadata');
    }

    this.trustedSet.root.verifyDelegate(MetadataKind.Snapshot, newSnapshot);

    // version not checked against meta version to allow old snapshot to be
    // used in rollback protection: it is checked when targets is updated

    // If an existing trusted snapshot is updated, check for rollback attack

    if (this.trustedSet.snapshot) {
      Object.entries(this.trustedSet.snapshot.signed.meta).forEach(
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
    console.log('Updated snapshot v', newSnapshot.signed.version);

    // snapshot is loaded, but we raise if it's not valid _final_ snapshot
    this.checkFinalSnapsnot();

    return newSnapshot;
  }

  private checkFinalTimestamp() {
    if (!this.trustedSet.timestamp) {
      throw new Error('No trusted timestamp metadata');
    }
    if (this.trustedSet.timestamp.signed.isExpired(this.referenceTime)) {
      throw new Error('Final timestamp.json is expired');
    }
  }

  private checkFinalSnapsnot() {
    // Raise if snapshot is expired or meta version does not match
    if (!this.trustedSet.snapshot) {
      throw new Error('No trusted snapshot metadata');
    }
    if (!this.trustedSet.timestamp) {
      throw new Error('No trusted timestamp metadata');
    }

    if (this.trustedSet.snapshot.signed.isExpired(this.referenceTime)) {
      throw new Error('snapshot.json is expired');
    }

    const snapshotMeta = this.trustedSet.timestamp.signed.snapshotMeta;

    if (this.trustedSet.snapshot.signed.version !== snapshotMeta.version) {
      throw new Error("Snapshot version doesn't match timestamp");
    }
  }

  public updateDelegatedTargets(
    bytesBuffer: Buffer,
    roleName: string,
    delegatorName: string
  ) {
    if (!this.trustedSet.snapshot) {
      throw new Error('Cannot update delegated targets before snapshot');
    }

    // Targets cannot be loaded if final snapshot is expired or its version
    // does not match meta version in timestamp
    this.checkFinalSnapsnot();

    if (
      !(
        delegatorName === 'root' ||
        delegatorName === 'targets' ||
        delegatorName === 'timestamp' ||
        delegatorName === 'snapshot'
      )
    ) {
      throw new Error('Invalid delegator name');
    }
    if (
      !(
        roleName === 'root' ||
        roleName === 'targets' ||
        roleName === 'timestamp' ||
        roleName === 'snapshot'
      )
    ) {
      throw new Error('Invalid role name');
    }

    const delegator = this.trustedSet[delegatorName];
    if (!delegator) {
      throw new Error(`No trusted ${delegatorName} metadata`);
    }

    console.log('Updating %s delegated by %s', roleName, delegatorName);

    // Verify against the hashes in snapshot, if any
    const meta = this.trustedSet.snapshot.signed.meta?.[`${roleName}.json`];
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

    this.trustedSet['targets'] = newDelegate;
    console.log('Updated ', roleName, version);
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
