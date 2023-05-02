import fs from 'fs';
import nock from 'nock';
import os from 'os';
import path from 'path';
import { KeyPair } from './key';
import {
  createRootMeta,
  createSnapshotMeta,
  createTargetsMeta,
  createTimestampMeta,
} from './metadata';
import { Target, collectTargets } from './target';

export type { Target } from './target';

interface MockRepoOptions {
  baseURL?: string;
  metadataPathPrefix?: string;
  targetPathPrefix?: string;
  cachePath?: string;
}

export function mockRepo(
  baseURL: string,
  targets: Target[],
  options: Omit<MockRepoOptions, 'baseURL' | 'cachePath'> = {}
): string {
  const metadataPrefix = options.metadataPathPrefix ?? '/metadata';
  const targetPrefix = options.targetPathPrefix ?? '/targets';
  const keyPair = new KeyPair();

  // Translate the input targets into TUF TargetFile objects
  const targetFiles = collectTargets(targets);

  // Generate all of the TUF metadata objects
  const targetsMeta = createTargetsMeta(targetFiles, keyPair);
  const snapshotMeta = createSnapshotMeta(targetsMeta, keyPair);
  const timestampMeta = createTimestampMeta(snapshotMeta, keyPair);
  const rootMeta = createRootMeta(keyPair);

  // Calculate paths for all of the metadata files
  const rootPath = `${metadataPrefix}/1.root.json`;
  const timestampPath = `${metadataPrefix}/timestamp.json`;
  const snapshotPath = `${metadataPrefix}/snapshot.json`;
  const targetsPath = `${metadataPrefix}/targets.json`;

  // Mock the metadata endpoints
  nock(baseURL).get(rootPath).reply(200, rootMeta);
  nock(baseURL).get(timestampPath).reply(200, timestampMeta);
  nock(baseURL).get(snapshotPath).reply(200, snapshotMeta);
  nock(baseURL).get(targetsPath).reply(200, targetsMeta);

  // Mock the target endpoints
  targets.forEach((target) => {
    nock(baseURL)
      .get(`${targetPrefix}/${target.name}`)
      .reply(200, target.content);
  });

  // Mock a 404 response for non-existent metadata/target files
  nock(baseURL).get(/.*/).reply(404);

  return JSON.stringify(rootMeta);
}

export function clearMock() {
  nock.cleanAll();
}

class Scope {
  private readonly targets: Target[];
  private readonly options: MockRepoOptions;
  public readonly baseURL: string;
  public readonly cachePath: string;

  constructor(targets: Target[], options: MockRepoOptions = {}) {
    this.targets = targets;
    this.options = options;

    this.baseURL =
      options.baseURL ??
      `http://${Math.random().toString(36).substring(2)}.com`;

    if (options.cachePath) {
      fs.mkdirSync(options.cachePath, { recursive: true });
      this.cachePath = options.cachePath;
    } else {
      this.cachePath = fs.mkdtempSync(
        path.join(os.tmpdir(), 'tuf-cache-test-')
      );
    }
    this.setup();
  }

  public reset() {
    this.teardown();
    this.setup();
  }

  public teardown() {
    clearMock();
    fs.rmSync(this.cachePath, { recursive: true });
  }

  private setup() {
    const rootJSON = mockRepo(this.baseURL, this.targets, this.options);
    fs.writeFileSync(path.join(this.cachePath, 'root.json'), rootJSON);
  }
}

export default (targets: Target | Target[], options: MockRepoOptions = {}) => {
  if (!Array.isArray(targets)) {
    targets = [targets];
  }
  return new Scope(targets, options);
};
