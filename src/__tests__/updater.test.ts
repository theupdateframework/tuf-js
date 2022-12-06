import fs from 'fs';
import nock from 'nock';
import path from 'path';
import { Updater, UpdaterOptions } from '../updater';
import { rawRootJson } from './__fixtures__/roots';
import { rawSnapshotJson } from './__fixtures__/snapshots';
import { rawFile1Txt, rawTargetsJson } from './__fixtures__/targets';
import { rawTimestampJson } from './__fixtures__/timestamps';

describe('Updater Test', () => {
  const baseURL = 'http://localhost:8080';
  const metadataBaseUrl = `${baseURL}/metadata`;
  const targetBaseUrl = `${baseURL}/targets`;

  const metadataDir = './metadata';
  const targetDir = './targets';

  beforeEach(() => {
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir);
    }

    if (!fs.existsSync(path.join(metadataDir, 'root.json'))) {
      fs.copyFileSync(
        'examples/client-example/1.root.json',
        path.join(metadataDir, 'root.json')
      );
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir);
    }
  });

  afterEach(() => {
    // fs.rmSync(metadataDir, { recursive: true });
    // fs.rmSync(targetDir, { recursive: true });
  });

  describe('Init Updater', () => {
    it('Init Updater with empty metadata dir', () => {
      const options: UpdaterOptions = {
        metadataDir: '',
        metadataBaseUrl: '',
        targetDir: '',
      };

      expect(() => new Updater(options)).toThrow(
        'ENOENT: no such file or directory'
      );
    });

    it('Init Updater with existing metadata base url', () => {
      const options: UpdaterOptions = {
        metadataDir: metadataDir,
        metadataBaseUrl: '',
        targetDir: '',
      };

      expect(() => new Updater(options)).not.toThrow();
    });
  });

  describe('Updater Refresh', () => {
    beforeEach(() => {
      nock(baseURL).get('/metadata/1.root.json').reply(200, rawRootJson);
      nock(baseURL).get('/metadata/snapshot.json').reply(200, rawSnapshotJson);
      nock(baseURL)
        .get('/metadata/timestamp.json')
        .reply(200, rawTimestampJson);
      nock(baseURL).get('/metadata/targets.json').reply(200, rawTargetsJson);
      nock(baseURL).get('/targets/file1.txt').reply(200, rawFile1Txt);
    });

    it('Pass in invalid url', async () => {
      const options: UpdaterOptions = {
        metadataDir: metadataDir,
        metadataBaseUrl: '',
        targetDir: targetDir,
      };

      const updater = new Updater(options);

      await expect(updater.refresh()).rejects.toThrow('Invalid URL');
    });

    it('Pass in valid url and refresh', async () => {
      const options: UpdaterOptions = {
        metadataDir: metadataDir,
        metadataBaseUrl: metadataBaseUrl,
        targetDir: targetDir,
        targetBaseUrl: targetBaseUrl,
      };

      const updater = new Updater(options);

      await expect(updater.refresh()).resolves.not.toThrow();
    });

    it('Pass in valid url and refresh', async () => {
      const options: UpdaterOptions = {
        metadataDir: metadataDir,
        metadataBaseUrl: metadataBaseUrl,
        targetDir: targetDir,
        targetBaseUrl: targetBaseUrl,
      };

      const updater = new Updater(options);
      const target = 'file1.txt';

      await updater.refresh();
      const targetInfo = await updater.getTargetInfo(target);

      if (!targetInfo) {
        // console.log(`Target ${target} doesn't exist`);
        return;
      }
      const targetPath = await updater.findCachedTarget(targetInfo);
      if (targetPath) {
        // console.log(`Target ${target} is cached at ${targetPath}`);
        return;
      }

      await expect(updater.downloadTarget(targetInfo)).resolves.not.toThrow();
    });
  });
});
