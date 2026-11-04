import { execFileSync } from 'child_process';
import path from 'path';

describe('CommonJS compatibility', () => {
  it('loads the built packages and downloads a mocked target', () => {
    const script = `
      const assert = require('node:assert/strict');
      const fs = require('node:fs');
      const nock = require('nock').default;
      const tufmock = require('@tufjs/repo-mock').default;
      const { Updater } = require('tuf-js');

      nock.disableNetConnect();
      const scope = tufmock([{ name: 'example.txt', content: 'test target' }]);
      const updater = new Updater({
        metadataBaseUrl: scope.baseURL + '/metadata',
        targetBaseUrl: scope.baseURL + '/targets',
        metadataDir: scope.cachePath,
        targetDir: scope.cachePath,
        config: { fetchRetry: 0 },
      });

      (async () => {
        try {
          const target = await updater.getTargetInfo('example.txt');
          assert(target);
          const targetPath = await updater.downloadTarget(target);
          assert.equal(fs.readFileSync(targetPath, 'utf8'), 'test target');
        } finally {
          scope.teardown();
        }
      })().catch((error) => {
        console.error(error);
        process.exitCode = 1;
      });
    `;

    expect(() =>
      execFileSync(process.execPath, ['-e', script], {
        cwd: path.resolve(__dirname, '../../..'),
        timeout: 10000,
      })
    ).not.toThrow();
  });
});
