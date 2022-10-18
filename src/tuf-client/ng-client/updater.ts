import * as fs from 'fs';
import * as path from 'path';
import { updaterConfig } from '../utils/config';
import { JSONObject } from '../utils/type';
import { TrustedMetadataSet } from './internal/trustedMetadataSet';

const ENDPOINT = 'https://sigstore-tuf-root.storage.googleapis.com';

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
  private trustedSet?: TrustedMetadataSet;
  private config?: typeof updaterConfig;

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

  public refresh = () => {
    this.loadRoot();
  };

  private loadLocalMetadata(): JSONObject {
    const filePath = path.join(this.dir, '1.root.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  private loadRoot() {
    // Load remote root metadata.
    // Sequentially load and persist on local disk every newer root metadata
    // version available on the remote.

    const rootVersion = this?.trustedSet?.trustedSet.root?.signed.version || 0;
    const data = fetch(`${ENDPOINT}/${rootVersion + 1}.root.json`).then(
      (res) => {
        console.log('data', res);
        return res;
      }
    );
    console.log('data2', data);
    // this.trustedSet?.updateRoot(data);
  }
}
