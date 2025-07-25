import fs from 'fs';
import nock from 'nock';
import os from 'os';
import path from 'path';
import { TUFHandlerOptions, tufHandlers } from './handler';
import { mock } from './mock';
import { initializeTUFRepo } from './repo';
import { Target } from './shared.types';

export { tufHandlers } from './handler';
export { initializeTUFRepo } from './repo';
export type { Target } from './shared.types';
export type { TUFHandlerOptions } from './handler';
export type { TUFRepo } from './repo';

type MockRepoOptions = {
  baseURL?: string;
  cachePath?: string;
} & TUFHandlerOptions;

export function mockRepo(
  baseURL: string,
  targets: Target[],
  options: TUFHandlerOptions = {}
): string {
  const tufRepo = initializeTUFRepo(targets);
  const handlers = tufHandlers(tufRepo, options);

  handlers.forEach((handler) => {
    // Don't set-up a mock for the 1.root.json file as this should never be
    // fetched in a normal TUF flow.
    if (handler.path.endsWith('1.root.json')) {
      return;
    }

    mock(baseURL, handler);
  });

  return JSON.stringify(tufRepo.rootMeta.toJSON());
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
