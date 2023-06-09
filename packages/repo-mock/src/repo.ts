import { Metadata, Root, Snapshot, Targets, Timestamp } from '@tufjs/models';
import { KeyPair } from './key';
import {
  createRootMeta,
  createSnapshotMeta,
  createTargetsMeta,
  createTimestampMeta,
} from './metadata';
import { collectTargets } from './target';

import type { Target } from './shared.types';

export interface TUFRepo {
  rootMeta: Metadata<Root>;
  timestampMeta: Metadata<Timestamp>;
  snapshotMeta: Metadata<Snapshot>;
  targetsMeta: Metadata<Targets>;
  targets: Target[];
}

export function initializeTUFRepo(targets: Target[]): TUFRepo {
  const keyPair = new KeyPair();
  // Translate the input targets into TUF TargetFile objects
  const targetFiles = collectTargets(targets);

  // Generate all of the TUF metadata objects
  const targetsMeta = createTargetsMeta(targetFiles, keyPair);
  const snapshotMeta = createSnapshotMeta(targetsMeta, keyPair);
  const timestampMeta = createTimestampMeta(snapshotMeta, keyPair);
  const rootMeta = createRootMeta(keyPair);

  return {
    rootMeta,
    snapshotMeta,
    timestampMeta,
    targetsMeta,
    targets,
  };
}
