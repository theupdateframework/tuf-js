import * as fs from 'fs';
import * as path from 'path';
import { Metadata, Targets } from './models';
import { TargetFile } from './models/file';
import { TrustedMetadataSet } from './trusted_metadata_set';
import { updaterConfig } from './utils/config';
import { isMetadataKind } from './utils/guard';
import { MetadataKind } from './utils/types';

interface UodaterOptions {
  metadataDir: string;
  metadataBaseUrl: string;
  targetDir?: string;
  targetBaseUrl?: string;
}

interface Delegation {
  roleName: MetadataKind;
  parentRoleName: MetadataKind;
}

export class Updater {
  private dir: string;
  private metadataBaseUrl: string;
  private targetDir?: string;
  private targetBaseUrl?: string;
  private trustedSet: TrustedMetadataSet;
  private config: typeof updaterConfig;

  constructor(options: UodaterOptions) {
    const { metadataDir, metadataBaseUrl, targetDir, targetBaseUrl } = options;

    this.dir = metadataDir;
    this.metadataBaseUrl = metadataBaseUrl;

    this.targetDir = targetDir;
    this.targetBaseUrl = targetBaseUrl;

    const data = this.loadLocalMetadata('1.root');
    this.trustedSet = new TrustedMetadataSet(data);
    this.config = updaterConfig;

    // self._trusted_set = trusted_metadata_set.TrustedMetadataSet(data)
    // self._fetcher = fetcher or requests_fetcher.RequestsFetcher()
    // self.config = config or UpdaterConfig()
  }

  public async refresh() {
    await this.loadRoot();
    await this.loadTimestamp();
    await this.loadSnapshot();
    await this.loadTargets(MetadataKind.Targets, MetadataKind.Root);
  }

  private loadLocalMetadata(fileName: string): Buffer {
    const filePath = path.join(this.dir, `${fileName}.json`);
    return fs.readFileSync(filePath);
  }

  private async loadRoot() {
    // Load remote root metadata.
    // Sequentially load and persist on local disk every newer root metadata
    // version available on the remote.
    console.log('Loading root metadata');
    const rootVersion = this.trustedSet.root.signed.version;

    const lowerBound = rootVersion + 1;
    const upperBound = lowerBound + this.config.maxRootRotations;

    for (let version = lowerBound; version <= upperBound; version++) {
      const url = `${this.metadataBaseUrl}/${version}.root.json`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          break;
        }
        const bytesData = Buffer.from(await response.arrayBuffer());
        this.trustedSet.updateRoot(bytesData);
        this.persistMetadata(MetadataKind.Root, bytesData);
      } catch (error) {
        console.log('error', error);
        break;
      }
    }

    console.log('--------------------------------');
  }

  private async loadTimestamp() {
    console.log('Loading timestamp metadata');

    // Load local and remote timestamp metadata
    try {
      const data = this.loadLocalMetadata(MetadataKind.Timestamp);
      this.trustedSet.updateTimestamp(data);
    } catch (error) {
      console.error('Cannot load local timestamp metadata');
    }

    //Load from remote (whether local load succeeded or not)
    const url = `${this.metadataBaseUrl}/timestamp.json`;
    try {
      const response = await fetch(url);

      if (!response.ok) {
        return;
      }
      const bytesData = Buffer.from(await response.arrayBuffer());
      this.trustedSet.updateTimestamp(bytesData);
      this.persistMetadata(MetadataKind.Timestamp, bytesData);
    } catch (error) {
      console.log('error', error);
    }
    console.log('--------------------------------');
  }

  private async loadSnapshot() {
    console.log('Loading snapshot metadata');
    //Load local (and if needed remote) snapshot metadata
    try {
      const data = this.loadLocalMetadata(MetadataKind.Snapshot);
      this.trustedSet.updateSnapshot(data, true);
      console.log('Local snapshot is valid: not downloading new one');
    } catch (error) {
      console.log('Local snapshot is invalid: downloading new one');
      if (!this.trustedSet.timestamp) {
        throw new Error('No timestamp metadata');
      }
      const snapshotMeta = this.trustedSet.timestamp.signed.snapshotMeta;
      // TODO: use length for fetching
      // const length = snapshotMeta.length || this.config.snapshotMaxLength;

      const version = this.trustedSet.root.signed.consistentSnapshot
        ? snapshotMeta.version
        : undefined;

      const url = version
        ? `${this.metadataBaseUrl}/${version}.snapshot.json`
        : `${this.metadataBaseUrl}/snapshot.json`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          return;
        }
        const bytesData = Buffer.from(await response.arrayBuffer());

        this.trustedSet.updateSnapshot(bytesData);
        this.persistMetadata(MetadataKind.Snapshot, bytesData);
      } catch (error) {
        console.log('error', error);
      }
    }
    console.log('--------------------------------');
  }

  private async loadTargets(
    role: MetadataKind,
    parentRole: MetadataKind
  ): Promise<Metadata<Targets> | undefined> {
    console.log(`Loading ${role} metadata`);

    if (this.trustedSet.targets) {
      return this.trustedSet.targets;
    }

    try {
      const buffer = this.loadLocalMetadata(role);
      this.trustedSet.updateDelegatedTargets(buffer, role, parentRole);
      console.log('Local %s is valid: not downloading new one', role);
    } catch (error) {
      // Local 'role' does not exist or is invalid: update from remote
      console.log('Local %s is invalid: downloading new one', role);

      if (!this.trustedSet.snapshot) {
        throw new Error('No snapshot metadata');
      }

      const metaInfo = this.trustedSet.snapshot.signed.meta[`${role}.json`];

      // TODO: use length for fetching
      // const length = metaInfo.length || this.config.targetsMaxLength;

      const version = this.trustedSet.root.signed.consistentSnapshot
        ? metaInfo.version
        : undefined;

      const url = version
        ? `${this.metadataBaseUrl}/${version}.${role}.json`
        : `${this.metadataBaseUrl}/${role}.json`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          return;
        }
        const bytesData = Buffer.from(await response.arrayBuffer());

        this.trustedSet.updateDelegatedTargets(bytesData, role, parentRole);
        this.persistMetadata(role, bytesData);
      } catch (error) {
        console.log('error', error);
      }
    }
    console.log('--------------------------------');
  }

  public async getTargetInfo(
    targetPath: string
  ): Promise<TargetFile | undefined> {
    /***
     * Returns ``TargetFile`` instance with information for ``target_path``.

    The return value can be used as an argument to
    ``download_target()`` and ``find_cached_target()``.

    If ``refresh()`` has not been called before calling
    ``get_targetinfo()``, the refresh will be done implicitly.

    As a side-effect this method downloads all the additional (delegated
    targets) metadata it needs to return the target information.

    Args:
        target_path: `path-relative-URL string
            <https://url.spec.whatwg.org/#path-relative-url-string>`_
            that uniquely identifies the target within the repository.

    Raises:
        OSError: New metadata could not be written to disk
        RepositoryError: Metadata failed to verify in some way
        DownloadError: Download of a metadata file failed in some way

    Returns:
        ``TargetFile`` instance or ``None``.
    ***/
    if (!this.trustedSet.targets) {
      this.refresh();
    }
    return this.preorderDepthFirstWalk(targetPath);
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

    // Preorder depth-first traversal of the graph of target delegations.
    while (
      visitedRoleNames.size <= this.config.maxDelegations &&
      delegationsToVisit.length > 0
    ) {
      //  Pop the role name from the top of the stack.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { roleName, parentRoleName } = delegationsToVisit.pop()!;

      if (!roleName || !parentRoleName) {
        break;
      }

      // Skip any visited current role to prevent cycles.
      if (visitedRoleNames.has(roleName)) {
        console.log('Skipping visited current role %s', roleName);
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
        console.log('Found target %s in role %s', targetPath, roleName);
        return target;
      }

      // After preorder check, add current role to set of visited roles.
      visitedRoleNames.add(roleName);

      if (targets.delegations) {
        const childRolesToVisit: Delegation[] = [];

        // NOTE: This may be a slow operation if there are many delegated roles.
        const rolesForTarget = targets.delegations.rolesForTarget(targetPath);

        for (const { role: childName, terminating } of rolesForTarget) {
          console.log('Adding child role %s', childName);
          if (!isMetadataKind(childName)) {
            throw new Error(`Invalid child role name: ${childName}`);
          }
          childRolesToVisit.push({
            roleName: childName,
            parentRoleName: roleName,
          });
          if (terminating) {
            console.log('Terminating delegation at %s', childName);
            delegationsToVisit.splice(0); // empty the array
            break;
          }
        }
        childRolesToVisit.reverse();
        delegationsToVisit.push(...childRolesToVisit);
      }
    }
    if (delegationsToVisit.length > 0) {
      console.log(
        '%d delegations left to visit but allowed at most %d delegations',
        delegationsToVisit.length,
        this.config.maxDelegations
      );
    }
  }

  public async findCachedTarget(
    targetInfo: TargetFile,
    filePath?: string
  ): Promise<string | undefined> {
    if (!filePath) {
      filePath = this.generateTargetPath(targetInfo);
    }

    try {
      const targetFile = fs.readFileSync(filePath);
      targetInfo.verify(targetFile);
      return filePath;
    } catch (error) {
      return;
    }
  }

  private generateTargetPath(targetInfo: TargetFile): string {
    if (!this.targetDir) {
      throw new Error('Target directory not set');
    }
    return path.join(this.targetDir, targetInfo.path);
  }

  public async downloadTarget(
    targetInfo: TargetFile,
    filePath?: string,
    targetBaseUrl?: string
  ): Promise<string> {
    if (!filePath) {
      filePath = this.generateTargetPath(targetInfo);
    }

    if (!targetBaseUrl) {
      if (!this.targetBaseUrl) {
        throw new Error('Target base URL not set');
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

    const url = `${targetBaseUrl}/${targetFilePath}`;
    console.log('url', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    const targetFile = Buffer.from(await response.arrayBuffer());

    targetInfo.verify(targetFile);

    fs.writeFileSync(filePath, targetFile);

    return filePath;
  }

  private async persistMetadata(metaDataName: MetadataKind, bytesData: Buffer) {
    try {
      const filePath = path.join(this.dir, `${metaDataName}.json`);
      fs.writeFileSync(filePath, bytesData.toString('utf8'));
    } catch (error) {
      console.error('persistMetadata error', error);
    }
  }
}
