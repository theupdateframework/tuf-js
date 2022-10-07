import * as fs from 'fs';
import * as path from 'path';
import { Root } from '../api/metadata';
import { JSONValue } from '../utils/type';
import {TrustedMetadataSet} from './internal/trustedMetadataSet'
import {updaterConfig} from '../utils/config'

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

  private loadLocalMetadata(): JSONValue {
    const filePath = path.join(this.dir, '1.root.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  private loadRoot () {
    // Load remote root metadata. 
    // Sequentially load and persist on local disk every newer root metadata
    // version available on the remote.
  }
}
