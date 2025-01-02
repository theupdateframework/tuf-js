import {
  Metadata,
  MetadataKind,
  Root,
  Snapshot,
  Targets,
  Timestamp,
} from '@tufjs/models';
import {
  BadVersionError,
  EqualVersionError,
  ExpiredMetadataError,
  RepositoryError,
  RuntimeError,
} from './error';

type TrustedSet = {
  root?: Metadata<Root>;
  timestamp?: Metadata<Timestamp>;
  snapshot?: Metadata<Snapshot>;
  targets?: Metadata<Targets>;
} & { [key: string]: Metadata<Targets> };

export class TrustedMetadataStore {
  private trustedSet: TrustedSet = {};
  private referenceTime: Date;

  constructor(rootData: Buffer) {
    // Client workflow 5.1: record fixed update start time
    this.referenceTime = new Date();

    // Client workflow 5.2: load trusted root metadata
    this.loadTrustedRoot(rootData);
  }

  public get root(): Metadata<Root> {
    if (!this.trustedSet.root) {
      throw new ReferenceError('No trusted root metadata');
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = JSON.parse(bytesBuffer.toString('utf8'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const newRoot = Metadata.fromJSON(MetadataKind.Root, data);
    if (newRoot.signed.type != MetadataKind.Root) {
      throw new RepositoryError(`Expected 'root', got ${newRoot.signed.type}`);
    }

    // Client workflow 5.4: check for arbitrary software attack
    this.root.verifyDelegate(MetadataKind.Root, newRoot);

    // Client workflow 5.5: check for rollback attack
    if (newRoot.signed.version != this.root.signed.version + 1) {
      throw new BadVersionError(
        `Expected version ${this.root.signed.version + 1}, got ${
          newRoot.signed.version
        }`
      );
    }

    // Check that new root is signed by self
    newRoot.verifyDelegate(MetadataKind.Root, newRoot);

    // Client workflow 5.7: set new root as trusted root
    this.trustedSet.root = newRoot;
    return newRoot;
  }

  public updateTimestamp(bytesBuffer: Buffer): Metadata<Timestamp> {
    if (this.snapshot) {
      throw new RuntimeError('Cannot update timestamp after snapshot');
    }

    if (this.root.signed.isExpired(this.referenceTime)) {
      throw new ExpiredMetadataError('Final root.json is expired');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = JSON.parse(bytesBuffer.toString('utf8'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const newTimestamp = Metadata.fromJSON(MetadataKind.Timestamp, data);

    if (newTimestamp.signed.type != MetadataKind.Timestamp) {
      throw new RepositoryError(
        `Expected 'timestamp', got ${newTimestamp.signed.type}`
      );
    }

    // Client workflow 5.4.2: check for arbitrary software attack
    this.root.verifyDelegate(MetadataKind.Timestamp, newTimestamp);

    if (this.timestamp) {
      // Prevent rolling back timestamp version
      // Client workflow 5.4.3.1: check for rollback attack
      if (newTimestamp.signed.version < this.timestamp.signed.version) {
        throw new BadVersionError(
          `New timestamp version ${newTimestamp.signed.version} is less than current version ${this.timestamp.signed.version}`
        );
      }
      //  Keep using old timestamp if versions are equal.
      if (newTimestamp.signed.version === this.timestamp.signed.version) {
        throw new EqualVersionError(
          `New timestamp version ${newTimestamp.signed.version} is equal to current version ${this.timestamp.signed.version}`
        );
      }

      // Prevent rolling back snapshot version
      // Client workflow 5.4.3.2: check for rollback attack
      const snapshotMeta = this.timestamp.signed.snapshotMeta;
      const newSnapshotMeta = newTimestamp.signed.snapshotMeta;
      if (newSnapshotMeta.version < snapshotMeta.version) {
        throw new BadVersionError(
          `New snapshot version ${newSnapshotMeta.version} is less than current version ${snapshotMeta.version}`
        );
      }
    }

    // expiry not checked to allow old timestamp to be used for rollback
    // protection of new timestamp: expiry is checked in update_snapshot

    this.trustedSet.timestamp = newTimestamp;

    // Client workflow 5.4.4: check for freeze attack
    this.checkFinalTimestamp();

    return newTimestamp;
  }

  public updateSnapshot(
    bytesBuffer: Buffer,
    trusted = false
  ): Metadata<Snapshot> {
    if (!this.timestamp) {
      throw new RuntimeError('Cannot update snapshot before timestamp');
    }
    if (this.targets) {
      throw new RuntimeError('Cannot update snapshot after targets');
    }

    // Snapshot cannot be loaded if final timestamp is expired
    this.checkFinalTimestamp();

    const snapshotMeta = this.timestamp.signed.snapshotMeta;

    // Verify non-trusted data against the hashes in timestamp, if any.
    // Trusted snapshot data has already been verified once.
    // Client workflow 5.5.2: check against timestamp role's snaphsot hash
    if (!trusted) {
      snapshotMeta.verify(bytesBuffer);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = JSON.parse(bytesBuffer.toString('utf8'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const newSnapshot = Metadata.fromJSON(MetadataKind.Snapshot, data);

    if (newSnapshot.signed.type != MetadataKind.Snapshot) {
      throw new RepositoryError(
        `Expected 'snapshot', got ${newSnapshot.signed.type}`
      );
    }

    // Client workflow 5.5.3: check for arbitrary software attack
    this.root.verifyDelegate(MetadataKind.Snapshot, newSnapshot);

    // version check against meta version (5.5.4) is deferred to allow old
    // snapshot to be used in rollback protection

    // Client workflow 5.5.5: check for rollback attack
    if (this.snapshot) {
      Object.entries(this.snapshot.signed.meta).forEach(
        ([fileName, fileInfo]) => {
          const newFileInfo = newSnapshot.signed.meta[fileName];
          if (!newFileInfo) {
            throw new RepositoryError(
              `Missing file ${fileName} in new snapshot`
            );
          }
          if (newFileInfo.version < fileInfo.version) {
            throw new BadVersionError(
              `New version ${newFileInfo.version} of ${fileName} is less than current version ${fileInfo.version}`
            );
          }
        }
      );
    }

    this.trustedSet.snapshot = newSnapshot;

    // snapshot is loaded, but we raise if it's not valid _final_ snapshot
    // Client workflow 5.5.4 & 5.5.6
    this.checkFinalSnapsnot();

    return newSnapshot;
  }

  public updateDelegatedTargets(
    bytesBuffer: Buffer,
    roleName: string,
    delegatorName: string
  ) {
    if (!this.snapshot) {
      throw new RuntimeError('Cannot update delegated targets before snapshot');
    }

    // Targets cannot be loaded if final snapshot is expired or its version
    // does not match meta version in timestamp.
    this.checkFinalSnapsnot();

    const delegator = this.trustedSet[delegatorName];

    if (!delegator) {
      throw new RuntimeError(`No trusted ${delegatorName} metadata`);
    }

    // Extract metadata for the delegated role from snapshot
    const meta = this.snapshot.signed.meta?.[`${roleName}.json`];
    if (!meta) {
      throw new RepositoryError(`Missing ${roleName}.json in snapshot`);
    }

    // Client workflow 5.6.2: check against snapshot role's targets hash
    meta.verify(bytesBuffer);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = JSON.parse(bytesBuffer.toString('utf8'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const newDelegate = Metadata.fromJSON(MetadataKind.Targets, data);

    if (newDelegate.signed.type != MetadataKind.Targets) {
      throw new RepositoryError(
        `Expected 'targets', got ${newDelegate.signed.type}`
      );
    }

    // Client workflow 5.6.3: check for arbitrary software attack
    delegator.verifyDelegate(roleName, newDelegate);

    // Client workflow 5.6.4: Check against snapshot role’s targets version
    const version = newDelegate.signed.version;
    if (version != meta.version) {
      throw new BadVersionError(
        `Version ${version} of ${roleName} does not match snapshot version ${meta.version}`
      );
    }

    // Client workflow 5.6.5: check for a freeze attack
    if (newDelegate.signed.isExpired(this.referenceTime)) {
      throw new ExpiredMetadataError(`${roleName}.json is expired`);
    }

    this.trustedSet[roleName] = newDelegate;
  }

  // Verifies and loads data as trusted root metadata.
  // Note that an expired initial root is still considered valid.
  private loadTrustedRoot(bytesBuffer: Buffer) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = JSON.parse(bytesBuffer.toString('utf8'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const root = Metadata.fromJSON(MetadataKind.Root, data);

    if (root.signed.type != MetadataKind.Root) {
      throw new RepositoryError(`Expected 'root', got ${root.signed.type}`);
    }
    root.verifyDelegate(MetadataKind.Root, root);

    this.trustedSet['root'] = root;
  }

  private checkFinalTimestamp() {
    // Timestamp MUST be loaded
    if (!this.timestamp) {
      throw new ReferenceError('No trusted timestamp metadata');
    }

    // Client workflow 5.4.4: check for freeze attack
    if (this.timestamp.signed.isExpired(this.referenceTime)) {
      throw new ExpiredMetadataError('Final timestamp.json is expired');
    }
  }

  private checkFinalSnapsnot() {
    // Snapshot and timestamp MUST be loaded
    if (!this.snapshot) {
      throw new ReferenceError('No trusted snapshot metadata');
    }
    if (!this.timestamp) {
      throw new ReferenceError('No trusted timestamp metadata');
    }

    // Client workflow 5.5.6: check for freeze attack
    if (this.snapshot.signed.isExpired(this.referenceTime)) {
      throw new ExpiredMetadataError('snapshot.json is expired');
    }

    // Client workflow 5.5.4: check against timestamp role’s snapshot version
    const snapshotMeta = this.timestamp.signed.snapshotMeta;
    if (this.snapshot.signed.version !== snapshotMeta.version) {
      throw new BadVersionError("Snapshot version doesn't match timestamp");
    }
  }
}
