import * as fs from 'fs';
import * as path from 'path';
import {
  EqualVersionError,
  PersistError,
  RuntimeError,
  ValueError,
} from './error';
import { BaseFetcher, Fetcher } from './fetcher';
import { Metadata, Targets } from './models';
import { TargetFile } from './models/file';
import { TrustedMetadataStore } from './store';
import { Config, defaultConfig } from './utils/config';
import { MetadataKind } from './utils/types';

export interface UpdaterOptions {
  metadataDir: string;
  metadataBaseUrl: string;
  targetDir?: string;
  targetBaseUrl?: string;
  fetcher?: BaseFetcher;
  config?: Config;
}

interface Delegation {
  roleName: string;
  parentRoleName: string;
}

export class Updater {
  private dir: string;
  private metadataBaseUrl: string;
  private targetDir?: string;
  private targetBaseUrl?: string;
  private trustedSet: TrustedMetadataStore;
  private config: Config;
  private fetcher: BaseFetcher;

  constructor(options: UpdaterOptions) {
    const {
      metadataDir,
      metadataBaseUrl,
      targetDir,
      targetBaseUrl,
      fetcher,
      config,
    } = options;

    this.dir = metadataDir;
    this.metadataBaseUrl = metadataBaseUrl;

    this.targetDir = targetDir;
    this.targetBaseUrl = targetBaseUrl;

    const data = this.loadLocalMetadata(MetadataKind.Root);

    this.trustedSet = new TrustedMetadataStore(data);
    this.config = { ...defaultConfig, ...config };
    this.fetcher = fetcher || new Fetcher(this.config.fetchTimeout);
  }

  public async refresh() {
    await this.loadRoot();
    await this.loadTimestamp();
    await this.loadSnapshot();
    await this.loadTargets(MetadataKind.Targets, MetadataKind.Root);
  }

  // Returns the TargetFile instance with information for the given target path.
  //
  // Implicitly calls refresh if it hasn't already been called.
  public async getTargetInfo(
    targetPath: string
  ): Promise<TargetFile | undefined> {
    if (!this.trustedSet.targets) {
      this.refresh();
    }

    return this.preorderDepthFirstWalk(targetPath);
  }

  public async downloadTarget(
    targetInfo: TargetFile,
    filePath?: string,
    targetBaseUrl?: string
  ): Promise<string> {
    const targetPath = filePath || this.generateTargetPath(targetInfo);

    if (!targetBaseUrl) {
      if (!this.targetBaseUrl) {
        throw new ValueError('Target base URL not set');
      }
      targetBaseUrl = this.targetBaseUrl;
    }

    let targetFilePath = targetInfo.path;
    const consistentSnapshot = this.trustedSet.root.signed.consistentSnapshot;

    if (consistentSnapshot && this.config.prefixTargetsWithHash) {
      const hashes = Object.values(targetInfo.hashes);
      const basename = path.basename(targetFilePath);
      targetFilePath = `${hashes[0]}.${basename}`;
    }

    const url = path.join(targetBaseUrl, targetFilePath);

    // Client workflow 5.7.3: download target file
    await this.fetcher.downloadFile(
      url,
      targetInfo.length,
      async (fileName) => {
        // Verify hashes and length of downloaded file
        await targetInfo.verify(fs.createReadStream(fileName));

        // Copy file to target path
        fs.copyFileSync(fileName, targetPath);
      }
    );

    return targetPath;
  }

  public async findCachedTarget(
    targetInfo: TargetFile,
    filePath?: string
  ): Promise<string | undefined> {
    if (!filePath) {
      filePath = this.generateTargetPath(targetInfo);
    }

    try {
      if (fs.existsSync(filePath)) {
        targetInfo.verify(fs.createReadStream(filePath));
        return filePath;
      }
    } catch (error) {
      return undefined; // File not found
    }
    return undefined; // File not found
  }

  private loadLocalMetadata(fileName: string): Buffer {
    const filePath = path.join(this.dir, `${fileName}.json`);
    return fs.readFileSync(filePath);
  }

  // Sequentially load and persist on local disk every newer root metadata
  // version available on the remote.
  // Client workflow 5.3: update root role
  private async loadRoot() {
    // Client workflow 5.3.2: version of trusted root metadata file
    const rootVersion = this.trustedSet.root.signed.version;

    const lowerBound = rootVersion + 1;
    const upperBound = lowerBound + this.config.maxRootRotations;

    for (let version = lowerBound; version <= upperBound; version++) {
      const url = path.join(this.metadataBaseUrl, `${version}.root.json`);
      try {
        // Client workflow 5.3.3: download new root metadata file
        const bytesData = await this.fetcher.downloadBytes(
          url,
          this.config.rootMaxLength
        );

        // Client workflow 5.3.4 - 5.4.7
        this.trustedSet.updateRoot(bytesData);

        // Client workflow 5.3.8: persist root metadata file
        this.persistMetadata(MetadataKind.Root, bytesData);
      } catch (error) {
        break;
      }
    }
  }

  // Load local and remote timestamp metadata.
  // Client workflow 5.4: update timestamp role
  private async loadTimestamp() {
    // Load local and remote timestamp metadata
    try {
      const data = this.loadLocalMetadata(MetadataKind.Timestamp);
      this.trustedSet.updateTimestamp(data);
    } catch (error) {
      // continue
    }

    //Load from remote (whether local load succeeded or not)
    const url = path.join(this.metadataBaseUrl, `timestamp.json`);

    // Client workflow 5.4.1: download timestamp metadata file
    const bytesData = await this.fetcher.downloadBytes(
      url,
      this.config.timestampMaxLength
    );

    try {
      // Client workflow 5.4.2 - 5.4.4
      this.trustedSet.updateTimestamp(bytesData);
    } catch (error) {
      // If new timestamp version is same as current, discardd the new one.
      // This is normal and should NOT raise an error.
      if (error instanceof EqualVersionError) {
        return;
      }

      // Re-raise any other error
      throw error;
    }

    // Client workflow 5.4.5: persist timestamp metadata
    this.persistMetadata(MetadataKind.Timestamp, bytesData);
  }

  // Load local and remote snapshot metadata.
  // Client workflow 5.5: update snapshot role
  private async loadSnapshot() {
    //Load local (and if needed remote) snapshot metadata
    try {
      const data = this.loadLocalMetadata(MetadataKind.Snapshot);
      this.trustedSet.updateSnapshot(data, true);
    } catch (error) {
      if (!this.trustedSet.timestamp) {
        throw new ReferenceError('No timestamp metadata');
      }
      const snapshotMeta = this.trustedSet.timestamp.signed.snapshotMeta;

      const maxLength = snapshotMeta.length || this.config.snapshotMaxLength;

      const version = this.trustedSet.root.signed.consistentSnapshot
        ? snapshotMeta.version
        : undefined;

      const url = path.join(
        this.metadataBaseUrl,
        version ? `${version}.snapshot.json` : `snapshot.json`
      );

      try {
        // Client workflow 5.5.1: download snapshot metadata file
        const bytesData = await this.fetcher.downloadBytes(url, maxLength);

        // Client workflow 5.5.2 - 5.5.6
        this.trustedSet.updateSnapshot(bytesData);

        // Client workflow 5.5.7: persist snapshot metadata file
        this.persistMetadata(MetadataKind.Snapshot, bytesData);
      } catch (error) {
        throw new RuntimeError(
          `Unable to load snapshot metadata error ${error}`
        );
      }
    }
  }

  // Load local and remote targets metadata.
  // Client workflow 5.6: update targets role
  private async loadTargets(
    role: string,
    parentRole: string
  ): Promise<Metadata<Targets> | undefined> {
    if (this.trustedSet.getRole(role)) {
      return this.trustedSet.getRole(role);
    }

    try {
      const buffer = this.loadLocalMetadata(role);
      this.trustedSet.updateDelegatedTargets(buffer, role, parentRole);
    } catch (error) {
      // Local 'role' does not exist or is invalid: update from remote
      if (!this.trustedSet.snapshot) {
        throw new ReferenceError('No snapshot metadata');
      }

      const metaInfo = this.trustedSet.snapshot.signed.meta[`${role}.json`];

      // TODO: use length for fetching
      const maxLength = metaInfo.length || this.config.targetsMaxLength;

      const version = this.trustedSet.root.signed.consistentSnapshot
        ? metaInfo.version
        : undefined;

      const url = path.join(
        this.metadataBaseUrl,
        version ? `${version}.${role}.json` : `${role}.json`
      );

      try {
        // Client workflow 5.6.1: download targets metadata file
        const bytesData = await this.fetcher.downloadBytes(url, maxLength);

        // Client workflow 5.6.2 - 5.6.6
        this.trustedSet.updateDelegatedTargets(bytesData, role, parentRole);

        // Client workflow 5.6.7: persist targets metadata file
        this.persistMetadata(role, bytesData);
      } catch (error) {
        throw new RuntimeError(`Unable to load targets error ${error}`);
      }
    }
    return this.trustedSet.getRole(role);
  }

  private async preorderDepthFirstWalk(
    targetPath: string
  ): Promise<TargetFile | undefined> {
    // Interrogates the tree of target delegations in order of appearance
    // (which implicitly order trustworthiness), and returns the matching
    // target found in the most trusted role.

    // List of delegations to be interrogated. A (role, parent role) pair
    // is needed to load and verify the delegated targets metadata.
    const delegationsToVisit: Delegation[] = [
      {
        roleName: MetadataKind.Targets,
        parentRoleName: MetadataKind.Root,
      },
    ];
    const visitedRoleNames: Set<string> = new Set();

    // Client workflow 5.6.7: preorder depth-first traversal of the graph of
    // target delegations
    while (
      visitedRoleNames.size <= this.config.maxDelegations &&
      delegationsToVisit.length > 0
    ) {
      //  Pop the role name from the top of the stack.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { roleName, parentRoleName } = delegationsToVisit.pop()!;

      // Skip any visited current role to prevent cycles.
      // Client workflow 5.6.7.1: skip already-visited roles
      if (visitedRoleNames.has(roleName)) {
        continue;
      }

      // The metadata for 'role_name' must be downloaded/updated before
      // its targets, delegations, and child roles can be inspected.
      const targets = (await this.loadTargets(roleName, parentRoleName))
        ?.signed;
      if (!targets) {
        continue;
      }

      const target = targets.targets?.[targetPath];
      if (target) {
        return target;
      }

      // After preorder check, add current role to set of visited roles.
      visitedRoleNames.add(roleName);

      if (targets.delegations) {
        const childRolesToVisit: Delegation[] = [];

        // NOTE: This may be a slow operation if there are many delegated roles.
        const rolesForTarget = targets.delegations.rolesForTarget(targetPath);

        for (const { role: childName, terminating } of rolesForTarget) {
          childRolesToVisit.push({
            roleName: childName,
            parentRoleName: roleName,
          });

          // Client workflow 5.6.7.2.1
          if (terminating) {
            delegationsToVisit.splice(0); // empty the array
            break;
          }
        }
        childRolesToVisit.reverse();
        delegationsToVisit.push(...childRolesToVisit);
      }
    }
    return undefined; // no matching target found
  }

  private generateTargetPath(targetInfo: TargetFile): string {
    if (!this.targetDir) {
      throw new ValueError('Target directory not set');
    }
    return path.join(this.targetDir, targetInfo.path);
  }

  private async persistMetadata(metaDataName: string, bytesData: Buffer) {
    try {
      const filePath = path.join(this.dir, `${metaDataName}.json`);
      fs.writeFileSync(filePath, bytesData.toString('utf8'));
    } catch (error) {
      throw new PersistError(
        `Failed to persist metadata ${metaDataName} error: ${error}`
      );
    }
  }
}
