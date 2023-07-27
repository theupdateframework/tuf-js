import { Metadata } from '@tufjs/models';
import { TUFRepo } from './repo';
import { Handler, HandlerFn } from './shared.types';

export interface TUFHandlerOptions {
  metadataPathPrefix?: string;
  targetPathPrefix?: string;
}

export function tufHandlers(
  tufRepo: TUFRepo,
  opts: TUFHandlerOptions
): Handler[] {
  const metadataPrefix = opts.metadataPathPrefix ?? '/metadata';
  const targetPrefix = opts.targetPathPrefix ?? '/targets';

  const handlers: Handler[] = [
    {
      path: `${metadataPrefix}/1.root.json`,
      fn: respondWithMetadata(tufRepo.rootMeta),
    },
    {
      path: `${metadataPrefix}/timestamp.json`,
      fn: respondWithMetadata(tufRepo.timestampMeta),
    },
    {
      path: `${metadataPrefix}/snapshot.json`,
      fn: respondWithMetadata(tufRepo.snapshotMeta),
    },
    {
      path: `${metadataPrefix}/targets.json`,
      fn: respondWithMetadata(tufRepo.targetsMeta),
    },
    {
      path: `${metadataPrefix}/2.root.json`,
      fn: () => ({ statusCode: 404, response: '' }),
    },
  ];

  tufRepo.targets.forEach((target) => {
    handlers.push({
      path: `${targetPrefix}/${target.name}`,
      fn: () => ({ statusCode: 200, response: target.content }),
    });
  });

  return handlers;
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function respondWithMetadata(meta: Metadata<any>): HandlerFn {
  return () => ({
    statusCode: 200,
    response: JSON.stringify(meta.toJSON()),
    contentType: 'application/json',
  });
}
