/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { clearMock, mockRepo } from '@tufjs/repo-mock';
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Updater, UpdaterOptions } from '../updater';

describe('Updater', () => {
  const baseURL = 'http://localhost:8080';
  const tufCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tufjs-'));

  const target = {
    name: 'foo.txt',
    content: 'hello, world!',
  };

  const options: UpdaterOptions = {
    metadataDir: tufCacheDir,
    targetDir: tufCacheDir,
    metadataBaseUrl: `${baseURL}/metadata`,
    targetBaseUrl: `${baseURL}/targets`,
    config: {
      fetchRetries: 0,
      fetchTimeout: 1000,
    },
  };

  // create the directory for metadata and targets and copy the root.json
  beforeEach(() => {
    const rootJSON = mockRepo(baseURL, [target]);
    fs.writeFileSync(path.join(tufCacheDir, 'root.json'), rootJSON);
  });

  // remove the directory for metadata and targets
  afterEach(() => {
    clearMock();
    fs.readdirSync(tufCacheDir).forEach((f) =>
      fs.rmSync(path.join(tufCacheDir, f))
    );
  });

  afterAll(() => {
    fs.rmdirSync(tufCacheDir);
  });

  describe('constructor', () => {
    describe('when the trusted root does NOT exist', () => {
      it('throws an error', () => {
        expect(
          () => new Updater({ ...options, metadataDir: 'invalid' })
        ).toThrow('ENOENT: no such file or directory');
      });
    });

    describe('when the trusted root does exist', () => {
      it('does NOT throw an error', () => {
        expect(() => new Updater(options)).not.toThrow();
      });
    });
  });

  describe('#refresh', () => {
    describe('when the repo URL is invalid', () => {
      it('throws an error', async () => {
        const updater = new Updater({
          ...options,
          metadataBaseUrl: 'invalid url',
        });
        await expect(updater.refresh()).rejects.toThrow('Invalid URL');
      });
    });

    describe('when the repo URL is valid', () => {
      it('resolves with no error', async () => {
        const updater = new Updater(options);
        await expect(updater.refresh()).resolves.toBe(undefined);
      });
    });
  });

  describe('#getTargetInfo', () => {
    let subject: Updater;

    beforeEach(async () => {
      subject = new Updater(options);
      await subject.refresh();
    });

    describe('when the target exists', () => {
      it('returns the target info', async () => {
        const targetInfo = await subject.getTargetInfo(target.name);

        expect(targetInfo).toBeDefined();
        expect(targetInfo?.path).toEqual(target.name);
        expect(targetInfo?.length).toBe(target.content.length);
      });
    });

    describe('when the target does NOT exist', () => {
      it('returns undefined', async () => {
        const targetInfo = await subject.getTargetInfo('invalid-target.txt');
        expect(targetInfo).toBeUndefined();
      });
    });
  });

  describe('#getTargetPath', () => {
    let subject: Updater;

    beforeEach(async () => {
      subject = new Updater(options);
      await subject.refresh();
    });

    describe('when the target exists in the cache', () => {
      beforeEach(() => {
        fs.writeFileSync(path.join(tufCacheDir, target.name), target.content);
      });

      it('returns the path', async () => {
        const targetInfo = await subject.getTargetInfo(target.name);
        const targetPath = await subject.findCachedTarget(targetInfo!);
        expect(targetPath).toEqual(path.join(tufCacheDir, target.name));
      });
    });

    describe('when the target does not exist in the cache', () => {
      it('returns undefined', async () => {
        const targetInfo = await subject.getTargetInfo(target.name);
        const targetPath = await subject.findCachedTarget(targetInfo!);
        expect(targetPath).toBeUndefined();
      });
    });

    describe('when the target exists in the cache but is out of date', () => {
      beforeEach(() => {
        fs.writeFileSync(path.join(tufCacheDir, target.name), 'bad content');
      });

      it('returns undefined', async () => {
        const targetInfo = await subject.getTargetInfo(target.name);
        const targetPath = await subject.findCachedTarget(targetInfo!);
        expect(targetPath).toBeUndefined();
      });
    });
  });

  describe('#downloadTarget', () => {
    let subject: Updater;

    beforeEach(async () => {
      subject = new Updater(options);
      await subject.refresh();
    });

    it('returns the path to the downloaded target', async () => {
      const targetInfo = await subject.getTargetInfo(target.name);
      assert(targetInfo);

      const targetPath = await subject.downloadTarget(targetInfo);
      expect(targetPath).toBeDefined();
      expect(targetPath).toEqual(path.join(tufCacheDir, target.name));
    });

    it('writes the file to the target directory', async () => {
      const targetInfo = await subject.getTargetInfo(target.name);
      assert(targetInfo);

      const targetPath = await subject.downloadTarget(targetInfo);
      expect(fs.readFileSync(targetPath, 'utf-8')).toEqual(target.content);
    });
  });
});
