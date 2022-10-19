import * as fs from 'fs';
import * as path from 'path';
import { MetadataKind } from '../api';
import { JSONObject } from '../api/types';
import { updaterConfig } from '../utils/config';
import { TrustedMetadataSet } from './internal/trusted_metadata_set';

interface UodaterOptions {
  metadataDir: string;
  metadataBaseUrl: string;
  targetDir?: string;
  targetBaseUrl?: string;
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

    const data = this.loadLocalMetadata();
    this.trustedSet = new TrustedMetadataSet(data);
    this.config = updaterConfig;

    // self._trusted_set = trusted_metadata_set.TrustedMetadataSet(data)
    // self._fetcher = fetcher or requests_fetcher.RequestsFetcher()
    // self.config = config or UpdaterConfig()
  }

  public async refresh() {
    await this.loadRoot();
  }

  private loadLocalMetadata(): JSONObject {
    const filePath = path.join(this.dir, '1.root.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  private async loadRoot() {
    // Load remote root metadata.
    // Sequentially load and persist on local disk every newer root metadata
    // version available on the remote.

    const rootVersion = this.trustedSet.hasRoot()
      ? this.trustedSet.root.signed.version
      : 0;

    const lowerBound = rootVersion + 1;
    const upperBound = lowerBound + this.config.maxRootRotations;

    for (let version = lowerBound; version <= upperBound; version++) {
      const url = `${this.metadataBaseUrl}/${version}.root.json`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          break;
        }
        const data = (await response.json()) as JSONObject;

        this.trustedSet.updateRoot(data);
        this.persistMetadata(MetadataKind.Root, data);

        // console.log('data', data, version);
      } catch (error) {
        console.log('error', error);
        break;
      }
    }
  }

  private async persistMetadata(metaDataName: MetadataKind, data: JSONObject) {
    try {
      const filePath = path.join(this.dir, `${metaDataName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data));
    } catch (error) {
      console.error('persistMetadata error', error);
    }
  }
}
