import {
  Metadata,
  MetaFile,
  Root,
  Snapshot,
  TargetFile,
  Targets,
  Timestamp,
} from '@tufjs/models';
import { digestSHA256 } from './crypto';
import { KeyPair } from './key';

export function createTargetsMeta(
  targetFiles: TargetFile[],
  keyPair: KeyPair
): Metadata<Targets> {
  const targets = new Metadata(
    new Targets({
      version: 1,
      specVersion: '1.0.0',
      expires: getExpires(),
    })
  );

  targetFiles.forEach((targetFile) => targets.signed.addTarget(targetFile));

  targets.sign((data) => keyPair.sign(data));

  return targets;
}

export function createSnapshotMeta(
  targets: Metadata<Targets>,
  keyPair: KeyPair
): Metadata<Snapshot> {
  const snapshot = new Metadata(
    new Snapshot({
      version: 1,
      specVersion: '1.0.0',
      expires: getExpires(),
      meta: { 'targets.json': toMetaFile(targets) },
    })
  );

  snapshot.sign((data) => keyPair.sign(data));
  return snapshot;
}

export function createTimestampMeta(
  snapshot: Metadata<Snapshot>,
  keyPair: KeyPair
): Metadata<Timestamp> {
  const timestamp = new Metadata(
    new Timestamp({
      version: 1,
      specVersion: '1.0.0',
      expires: getExpires(),
      snapshotMeta: toMetaFile(snapshot),
    })
  );

  timestamp.sign((data) => keyPair.sign(data));

  return timestamp;
}

export function createRootMeta(keyPair: KeyPair): Metadata<Root> {
  const root = new Metadata(
    new Root({
      version: 1,
      specVersion: '1.0.0',
      expires: getExpires(),
      consistentSnapshot: false,
    })
  );

  root.signed.addKey(keyPair.publicKey, 'root');
  root.signed.addKey(keyPair.publicKey, 'snapshot');
  root.signed.addKey(keyPair.publicKey, 'targets');
  root.signed.addKey(keyPair.publicKey, 'timestamp');

  root.sign((data) => keyPair.sign(data));

  return root;
}

function toMetaFile<T extends Root | Snapshot | Targets | Timestamp>(
  metadata: Metadata<T>
): MetaFile {
  const meta = JSON.stringify(metadata);
  return new MetaFile({
    version: 1,
    length: meta.length,
    hashes: { sha256: digestSHA256(meta) },
  });
}

function getExpires(): string {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  return expires.toISOString();
}
