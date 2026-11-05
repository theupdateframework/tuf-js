import { clearMock, mockRepo } from '@tufjs/repo-mock';
import assert from 'assert';
import fs from 'fs';
import nock from 'nock';
import os from 'os';
import path from 'path';
import { Updater, UpdaterOptions } from '../src/updater';

afterAll(() => nock.restore());

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
      fetchRetry: 0,
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

    describe('when repo serves invalid root metadata', () => {
      beforeEach(() => {
        // Remove 404 response for 2.root.json
        const repoURL = new URL(baseURL);
        // Nock supports hostname and port, but its type declarations omit them.
        const interceptor = {
          hostname: repoURL.hostname,
          port: repoURL.port,
          path: '/metadata/2.root.json',
        };
        expect(nock.removeInterceptor(interceptor)).toBe(true);

        // Serve 2.root.json w/ invalid data
        nock(baseURL).get('/metadata/2.root.json').reply(200, {});
      });

      it('resolves with no error', async () => {
        const updater = new Updater(options);
        await expect(updater.refresh()).rejects.toThrow(TypeError);
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

    describe('when the forceCache option is true', () => {
      it('returns the target info', async () => {
        // Clear the repo mock so we can't possibly get the target from the remote
        clearMock();

        const offlineUpdater = new Updater({ ...options, forceCache: true });
        const targetInfo = await offlineUpdater.getTargetInfo(target.name);

        expect(targetInfo).toBeDefined();
        expect(targetInfo?.path).toEqual(target.name);
        expect(targetInfo?.length).toBe(target.content.length);
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
    const itOnWindows = process.platform === 'win32' ? it : it.skip;
    const itOffWindows = process.platform === 'win32' ? it.skip : it;
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

    itOffWindows(
      'preserves the complete file for an already-open reader',
      async () => {
        const targetInfo = await subject.getTargetInfo(target.name);
        assert(targetInfo);
        const targetPath = path.join(tufCacheDir, target.name);
        const previous = 'previous complete target';
        fs.writeFileSync(targetPath, previous);
        const reader = await fs.promises.open(targetPath, 'r');

        try {
          await expect(subject.downloadTarget(targetInfo)).resolves.toBe(
            targetPath
          );
          expect(await reader.readFile('utf8')).toBe(previous);
          expect(fs.readFileSync(targetPath, 'utf8')).toBe(target.content);
        } finally {
          await reader.close();
        }
      }
    );

    itOnWindows(
      'retries replacement until the open reader closes',
      async () => {
        const targetInfo = await subject.getTargetInfo(target.name);
        assert(targetInfo);
        const targetPath = path.join(tufCacheDir, target.name);
        const previous = 'previous complete target';
        fs.writeFileSync(targetPath, previous);
        const reader = await fs.promises.open(targetPath, 'r');
        let notifyFirstAttempt: () => void = () => {};
        const firstAttempt = new Promise<void>((resolve) => {
          notifyFirstAttempt = resolve;
        });
        const originalRename = fs.promises.rename.bind(fs.promises);
        let attempts = 0;
        const rename = jest
          .spyOn(fs.promises, 'rename')
          .mockImplementation((source, destination) => {
            attempts++;
            if (attempts === 1) {
              notifyFirstAttempt();
            }
            return originalRename(source, destination);
          });
        let readerClosed = false;

        try {
          const download = subject.downloadTarget(targetInfo);
          await firstAttempt;
          await new Promise<void>((resolve) => setTimeout(resolve, 50));
          await reader.close();
          readerClosed = true;

          await expect(download).resolves.toBe(targetPath);
          expect(attempts).toBeGreaterThan(1);
          expect(fs.readFileSync(targetPath, 'utf8')).toBe(target.content);
        } finally {
          if (!readerClosed) {
            await reader.close();
          }
          rename.mockRestore();
        }
      }
    );

    itOnWindows(
      'stops retrying after persistent Windows rename errors',
      async () => {
        const targetInfo = await subject.getTargetInfo(target.name);
        assert(targetInfo);
        const targetPath = path.join(tufCacheDir, target.name);
        const previous = 'previous complete target';
        fs.writeFileSync(targetPath, previous);
        const entries = fs.readdirSync(tufCacheDir).sort();
        const error = Object.assign(new Error('rename failed'), {
          code: 'EPERM',
        });
        const rename = jest
          .spyOn(fs.promises, 'rename')
          .mockRejectedValue(error);

        try {
          await expect(subject.downloadTarget(targetInfo)).rejects.toBe(error);
          expect(rename).toHaveBeenCalledTimes(9);
          expect(fs.readFileSync(targetPath, 'utf8')).toBe(previous);
          expect(fs.readdirSync(tufCacheDir).sort()).toEqual(entries);
        } finally {
          rename.mockRestore();
        }
      }
    );

    it(
      'preserves the cached target and removes staging when rename fails',
      async () => {
        const targetInfo = await subject.getTargetInfo(target.name);
        assert(targetInfo);
        const targetPath = path.join(tufCacheDir, target.name);
        const previous = 'previous complete target';
        fs.writeFileSync(targetPath, previous);
        const entries = fs.readdirSync(tufCacheDir).sort();
        const error = Object.assign(new Error('rename failed'), {
          code: 'EIO',
        });
        const rename = jest
          .spyOn(fs.promises, 'rename')
          .mockRejectedValue(error);

        try {
          await expect(subject.downloadTarget(targetInfo)).rejects.toBe(error);
          expect(fs.readFileSync(targetPath, 'utf8')).toBe(previous);
          expect(fs.readdirSync(tufCacheDir).sort()).toEqual(entries);
        } finally {
          rename.mockRestore();
        }
      }
    );

    it(
      'does not publish a target that fails verification',
      async () => {
        const targetInfo = await subject.getTargetInfo(target.name);
        assert(targetInfo);
        const targetPath = path.join(tufCacheDir, target.name);
        const previous = 'previous complete target';
        fs.writeFileSync(targetPath, previous);
        const entries = fs.readdirSync(tufCacheDir).sort();
        const error = new Error('target verification failed');
        const verify = jest.spyOn(targetInfo, 'verify').mockRejectedValue(error);
        const rename = jest.spyOn(fs.promises, 'rename');

        try {
          await expect(subject.downloadTarget(targetInfo)).rejects.toBe(error);
          expect(rename).not.toHaveBeenCalled();
          expect(fs.readFileSync(targetPath, 'utf8')).toBe(previous);
          expect(fs.readdirSync(tufCacheDir).sort()).toEqual(entries);
        } finally {
          verify.mockRestore();
          rename.mockRestore();
        }
      }
    );

    it(
      'supports independent updaters publishing to the same custom path',
      async () => {
        const targetInfo = await subject.getTargetInfo(target.name);
        assert(targetInfo);
        const other = new Updater(options);
        const targetPath = path.join(tufCacheDir, 'custom-target.json');
        const entries = fs.readdirSync(tufCacheDir).sort();
        clearMock();
        nock(baseURL)
          .get(/^\/targets\//)
          .times(2)
          .reply(200, target.content);

        const results = await Promise.all([
          subject.downloadTarget(targetInfo, targetPath),
          other.downloadTarget(targetInfo, targetPath),
        ]);

        expect(results).toEqual([targetPath, targetPath]);
        expect(fs.readFileSync(targetPath, 'utf8')).toBe(target.content);
        expect(fs.readdirSync(tufCacheDir).sort()).toEqual(
          [...entries, 'custom-target.json'].sort()
        );
        expect(nock.isDone()).toBe(true);
      }
    );
  });
});
