import nock from 'nock';
import { KeyPair } from './key';
import {
  createRootMeta,
  createSnapshotMeta,
  createTargetsMeta,
  createTimestampMeta,
} from './metadata';
import { collectTargets, Target } from './target';

export type { Target } from './target';

export function mockRepo(baseURL: string, targets: Target[]): string {
  const keyPair = new KeyPair();

  // Translate the input targets into TUF TargetFile objects
  const targetFiles = collectTargets(targets);

  // Generate all of the TUF metadata objects
  const targetsMeta = createTargetsMeta(targetFiles, keyPair);
  const snapshotMeta = createSnapshotMeta(targetsMeta, keyPair);
  const timestampMeta = createTimestampMeta(snapshotMeta, keyPair);
  const rootMeta = createRootMeta(keyPair);

  // Mock the metadata endpoints
  nock(baseURL).get('/metadata/1.root.json').reply(200, rootMeta);
  nock(baseURL).get('/metadata/timestamp.json').reply(200, timestampMeta);
  nock(baseURL).get('/metadata/snapshot.json').reply(200, snapshotMeta);
  nock(baseURL).get('/metadata/targets.json').reply(200, targetsMeta);

  // Mock the target endpoints
  targets.forEach((target) => {
    nock(baseURL).get(`/targets/${target.name}`).reply(200, target.content);
  });

  // Mock a 404 response for non-existent metadata/target files
  nock(baseURL).get(/.*/).reply(404);

  return JSON.stringify(rootMeta);
}

export function clearMock() {
  nock.cleanAll();
}
