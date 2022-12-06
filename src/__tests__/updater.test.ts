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

  // remove the directory for metadata and targets
  afterEach(() => {
    fs.rmSync(metadataDir, { recursive: true });
    fs.rmSync(targetDir, { recursive: true });
  });

  describe('Init updater', () => {
    it('Init updater with empty metadata dir', () => {
      const options: UpdaterOptions = {
        metadataDir: 'invalid dir',
        targetDir: 'invalid dir',
        metadataBaseUrl: '',
        targetBaseUrl: '',
      };

      expect(() => new Updater(options)).toThrow(
        'ENOENT: no such file or directory'
      );
    });

    it('Init updater with existing metadata base url', () => {
      const options: UpdaterOptions = {
        metadataDir: metadataDir,
        targetDir: targetDir,
        metadataBaseUrl: metadataBaseUrl,
        targetBaseUrl: targetBaseUrl,
      };

      expect(() => new Updater(options)).not.toThrow();
    });
  });

  describe('Updater functionality', () => {
    // mock the http request for all metadata and targets
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
        targetDir: targetDir,
        metadataBaseUrl: 'invalid url',
        targetBaseUrl: 'invalid url',
      };

      const updater = new Updater(options);

      await expect(updater.refresh()).rejects.toThrow('Invalid URL');
    });

    it('Successfully download the target', async () => {
      const options: UpdaterOptions = {
        metadataDir: metadataDir,
        targetDir: targetDir,
        metadataBaseUrl: metadataBaseUrl,
        targetBaseUrl: targetBaseUrl,
      };

      const updater = new Updater(options);
      const target = 'file1.txt';

      await expect(updater.refresh()).resolves.not.toThrow();
      const targetInfo = await updater.getTargetInfo(target);

      if (!targetInfo) {
        return;
      }

      await expect(updater.downloadTarget(targetInfo)).resolves.not.toThrow();
    });
  });
});
