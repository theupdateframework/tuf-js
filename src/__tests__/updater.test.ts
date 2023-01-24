import fs from 'fs';
import nock from 'nock';
import path from 'path';
import { Updater, UpdaterOptions } from '../updater';
import { rawRootJson } from './__fixtures__/roots';
import { rawSnapshotJson } from './__fixtures__/snapshots';
import { rawFile1Txt, rawTargetsJson } from './__fixtures__/targets';
import { rawTimestampJson } from './__fixtures__/timestamps';

describe('Updater', () => {
  const baseURL = 'http://localhost:8080';
  const metadataBaseUrl = `${baseURL}/metadata`;
  const targetBaseUrl = `${baseURL}/targets`;

  const metadataDir = './metadata';
  const targetDir = './targets';

  const options: UpdaterOptions = {
    metadataDir: metadataDir,
    targetDir: targetDir,
    metadataBaseUrl: metadataBaseUrl,
    targetBaseUrl: targetBaseUrl,
  };

  // create the directory for metadata and targets and copy the root.json
  beforeEach(() => {
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir);
    }

    if (!fs.existsSync(path.join(metadataDir, 'root.json'))) {
      fs.copyFileSync(
        path.resolve(__dirname, '../../examples/client-example/1.root.json'),
        path.join(metadataDir, 'root.json')
      );
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir);
    }
  });

  beforeEach(() => {
    nock(baseURL).get('/metadata/1.root.json').reply(200, rawRootJson);
    nock(baseURL).get('/metadata/snapshot.json').reply(200, rawSnapshotJson);
    nock(baseURL).get('/metadata/timestamp.json').reply(200, rawTimestampJson);
    nock(baseURL).get('/metadata/targets.json').reply(200, rawTargetsJson);
    nock(baseURL).get('/targets/file1.txt').reply(200, rawFile1Txt);
  });

  // remove the directory for metadata and targets
  afterEach(() => {
    fs.rmSync(metadataDir, { recursive: true });
    fs.rmSync(targetDir, { recursive: true });
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

  describe('#getTargets', () => {
    describe('when the targets.json is valid', () => {
      it('throws an error', async () => {
        const updater = new Updater(options);

        const targets = await updater.getTargets();
        expect(targets).toBeDefined();
        expect(targets).toHaveLength(0);
        expect(targets).toBe([]);
      });
    });

    describe('when the targets.json is valid', () => {
      it('resolves with no error', async () => {
        const updater = new Updater(options);
        const targets = await updater.getTargets();
        expect(targets).toBeDefined();
        expect(targets).toHaveLength(2);
        expect(targets?.[0]?.path).toBe('file1.txt');
      });
    });
  });

  describe('#getTargetInfo', () => {
    describe('when the target exists', () => {
      const target = 'file1.txt';

      it('retrieves the target info', async () => {
        const updater = new Updater(options);
        await updater.refresh();

        const targetInfo = await updater.getTargetInfo(target);

        expect(targetInfo).toBeDefined();
        expect(targetInfo?.path).toBe('file1.txt');
        expect(targetInfo?.length).toBe(31);
      });
    });

    describe('when the target does NOT exist', () => {
      const target = 'file9.txt';

      it('retrieves the target info', async () => {
        const updater = new Updater(options);
        await updater.refresh();

        const targetInfo = await updater.getTargetInfo(target);

        expect(targetInfo).toBeUndefined();
      });
    });
  });

  describe('#downloadTarget', () => {
    let updater: Updater;

    beforeEach(async () => {
      updater = new Updater(options);
      await updater.refresh();
    });

    describe('when the target exists', () => {
      const target = 'file1.txt';

      it('returns the path to the downloaded file', async () => {
        const targetInfo = await updater.getTargetInfo(target);

        if (!targetInfo) {
          fail('targetInfo is undefined');
        }

        const file = await updater.downloadTarget(targetInfo);
        expect(file).toBeDefined();
        expect(file).toEqual(path.join(targetDir, target));
      });

      it('writes the file to the target directory', async () => {
        // TODO
      });
    });
  });
});
