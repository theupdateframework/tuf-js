import { clearMock, mockRepo } from '@tufjs/repo-mock';
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { Updater } from '../src/index';

describe('Updater', () => {
  const baseURL = 'http://localhost:8080';
  const tufCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tufjs-'));

  const target = {
    name: 'foo.txt',
    content: 'hello, world!',
  };

  beforeEach(() => {
    const rootJSON = mockRepo(baseURL, [target]);
    fs.writeFileSync(path.join(tufCacheDir, 'root.json'), rootJSON);
  });

  afterEach(() => {
    clearMock();
    fs.readdirSync(tufCacheDir).forEach((f) =>
      fs.rmSync(path.join(tufCacheDir, f))
    );
  });

  afterAll(() => {
    fs.rmdirSync(tufCacheDir);
  });

  it('downloads the target', async () => {
    const tuf = new Updater({
      metadataBaseUrl: `${baseURL}/metadata`,
      targetBaseUrl: `${baseURL}/targets`,
      metadataDir: tufCacheDir,
      targetDir: tufCacheDir,
    });

    const targetFile = await tuf.getTargetInfo(target.name);
    assert(targetFile);
    expect(targetFile.length).toEqual(target.content.length);
    expect(targetFile.path).toEqual(target.name);
    expect(targetFile.hashes).toHaveProperty('sha256');
    expect(targetFile.hashes['sha256']).toBeTruthy();

    const targetPath = await tuf.downloadTarget(targetFile);
    expect(fs.readFileSync(targetPath, 'utf-8')).toEqual(target.content);
  });
});
