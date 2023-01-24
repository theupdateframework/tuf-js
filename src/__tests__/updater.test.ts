import fs from 'fs';
import nock from 'nock';
import path from 'path';
import { Updater, UpdaterOptions } from '../updater';

const loadFile = (filename: string) => {
  return fs.readFileSync(path.resolve(__dirname, filename), 'utf8');
};

const file1RootMetadataPath = '../../repository_data/metadata/root.json';

const file1MetadataMap = {
  '1.root.json': '../../repository_data/metadata/1.root.json',
  'snapshot.json': '../../repository_data/metadata/snapshot.json',
  'targets.json': '../../repository_data/metadata/targets.json',
  'timestamp.json': '../../repository_data/metadata/timestamp.json',
};

const file1TargetsMap = {
  'file1.txt': '../../repository_data/targets/file1.txt',
};

const emptyTargetRootMetadataPath =
  '../../repository_data/empty_target_repo/metadata/1.root.json';

const emptyTargetMetadataMap = {
  '1.root.json': '../../repository_data/empty_target_repo/metadata/1.root.json',
  '2.root.json': '../../repository_data/empty_target_repo/metadata/2.root.json',
  'snapshot.json':
    '../../repository_data/empty_target_repo/metadata/snapshot.json',
  'targets.json':
    '../../repository_data/empty_target_repo/metadata/targets.json',
  'timestamp.json':
    '../../repository_data/empty_target_repo/metadata/timestamp.json',
};

const emptyTargetTargetsMap = {};

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
  const initDirectory = (rootJsonFile: string) => {
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir);
    }

    if (!fs.existsSync(path.join(metadataDir, 'root.json'))) {
      fs.copyFileSync(
        path.resolve(__dirname, rootJsonFile),
        path.join(metadataDir, 'root.json')
      );
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir);
    }
  };

  // create mock endpoints for metadata and targets
  const initEndpoints = (
    metadataMap: { [key: string]: string },
    targetsMap: { [key: string]: string }
  ) => {
    nock.cleanAll();
    for (const [key, value] of Object.entries(metadataMap)) {
      nock(baseURL).get(`/metadata/${key}`).reply(200, loadFile(value));
    }

    for (const [key, value] of Object.entries(targetsMap)) {
      nock(baseURL).get(`/targets/${key}`).reply(200, loadFile(value));
    }
  };

  // remove the directory for metadata and targets
  afterEach(() => {
    fs.rmSync(metadataDir, { recursive: true });
    fs.rmSync(targetDir, { recursive: true });
  });

  describe('constructor', () => {
    beforeEach(() => {
      initDirectory(file1RootMetadataPath);
      initEndpoints(file1MetadataMap, file1TargetsMap);
    });

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
    beforeEach(() => {
      initDirectory(file1RootMetadataPath);
      initEndpoints(file1MetadataMap, file1TargetsMap);
    });
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
    describe('when no tagerts in targets.json', () => {
      beforeEach(() => {
        initDirectory(emptyTargetRootMetadataPath);
        initEndpoints(emptyTargetMetadataMap, emptyTargetTargetsMap);
      });

      it('resolves with no error', async () => {
        const updater = new Updater(options);
        const targets = await updater.getTargets();

        expect(targets).toBeDefined();
        expect(targets).toHaveLength(0);
        expect(targets).toStrictEqual([]);
      });
    });

    describe('when have 3 targets in targets.json', () => {
      beforeEach(() => {
        initDirectory(file1RootMetadataPath);
        initEndpoints(file1MetadataMap, file1TargetsMap);
      });

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
    beforeEach(() => {
      initDirectory(file1RootMetadataPath);
      initEndpoints(file1MetadataMap, file1TargetsMap);
    });
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
      initDirectory(file1RootMetadataPath);
      initEndpoints(file1MetadataMap, file1TargetsMap);
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
