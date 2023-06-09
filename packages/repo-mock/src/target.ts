import { TargetFile } from '@tufjs/models';
import { digestSHA256 } from './crypto';

import type { Target } from './shared.types';

export function collectTargets(targets: Target[]): TargetFile[] {
  return targets.map((target) => {
    return new TargetFile({
      path: target.name,
      length: target.content.length,
      hashes: { sha256: digestSHA256(target.content) },
    });
  });
}
