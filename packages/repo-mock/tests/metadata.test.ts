import { TargetFile } from '@tufjs/models';
import { KeyPair } from '../src/key';
import {
  createRootMeta,
  createSnapshotMeta,
  createTargetsMeta,
  createTimestampMeta,
} from '../src/metadata';

const keyPair = new KeyPair();

const targetFile = new TargetFile({
  length: 0,
  hashes: {},
  path: 'foo.txt',
});

describe('createTargetsMeta', () => {
  it('creates a new targets meta', () => {
    const targets = createTargetsMeta([targetFile], keyPair);
    expect(targets).toBeTruthy();

    expect(targets.signatures).toHaveProperty(keyPair.publicKey.keyID);
    expect(targets.signatures[keyPair.publicKey.keyID]).toBeTruthy();

    expect(targets.signed.targets[targetFile.path]).toBeTruthy();
  });
});

describe('createSnapshotMeta', () => {
  it('creates a new snapshot meta', () => {
    const targets = createTargetsMeta([targetFile], keyPair);
    const snapshot = createSnapshotMeta(targets, keyPair);
    expect(snapshot).toBeTruthy();

    expect(snapshot.signatures).toHaveProperty(keyPair.publicKey.keyID);
    expect(snapshot.signatures[keyPair.publicKey.keyID]).toBeTruthy();

    expect(snapshot.signed.meta['targets.json']).toBeTruthy();
  });
});

describe('createTimestampMeta', () => {
  it('creates a new timestamp meta', () => {
    const targets = createTargetsMeta([targetFile], keyPair);
    const snapshot = createSnapshotMeta(targets, keyPair);
    const timestamp = createTimestampMeta(snapshot, keyPair);
    expect(timestamp).toBeTruthy();

    expect(timestamp.signatures).toHaveProperty(keyPair.publicKey.keyID);
    expect(timestamp.signatures[keyPair.publicKey.keyID]).toBeTruthy();

    expect(timestamp.signed.snapshotMeta).toBeTruthy();
  });
});

describe('createRootMeta', () => {
  it('creates a new root meta', () => {
    const root = createRootMeta(keyPair);
    expect(root).toBeTruthy();

    expect(root.signatures).toHaveProperty(keyPair.publicKey.keyID);
    expect(root.signatures[keyPair.publicKey.keyID]).toBeTruthy();

    expect(root.signed.keys[keyPair.publicKey.keyID]).toBeTruthy();

    expect(root.signed.roles).toHaveProperty('root');
    expect(root.signed.roles).toHaveProperty('targets');
    expect(root.signed.roles).toHaveProperty('snapshot');
    expect(root.signed.roles).toHaveProperty('timestamp');
  });
});
