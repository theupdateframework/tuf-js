import * as tuf from '../src';

it('exports classes', () => {
  expect(tuf.BaseFetcher).toBeInstanceOf(Function);
  expect(tuf.TargetFile).toBeInstanceOf(Function);
  expect(tuf.Updater).toBeInstanceOf(Function);
});

it('exports types', () => {
  const config: Partial<tuf.Config> = {};
  expect(config).toBeDefined();

  const fetcher: Partial<tuf.Fetcher> = {};
  expect(fetcher).toBeDefined();

  const updaterOpts: Partial<tuf.UpdaterOptions> = {};
  expect(updaterOpts).toBeDefined();
});
