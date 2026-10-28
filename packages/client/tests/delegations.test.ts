import {
  Key,
  Metadata,
  MetaFile,
  Root,
  Signature,
  Snapshot,
  Targets,
  Timestamp,
} from '@tufjs/models';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { DownloadHTTPError } from '../src/error';
import { Fetcher } from '../src/fetcher';
import { Updater } from '../src/updater';

describe('cached delegations', () => {
  const baseURL = 'http://localhost:8080';
  const keys = ['a', 'b'].map((keyID) => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    return {
      privateKey,
      key: new Key({
        keyID,
        keyType: 'ed25519',
        scheme: 'ed25519',
        keyVal: {
          public: publicKey.export({ format: 'pem', type: 'spki' }).toString(),
        },
      }),
    };
  });
  let metadataDir: string;

  beforeEach(() => {
    metadataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tufjs-delegations-'));
  });

  afterEach(() => {
    fs.rmSync(metadataDir, { recursive: true });
  });

  function sign<T extends Root | Timestamp | Snapshot | Targets>(
    signed: T,
    signer = keys[0]
  ): Metadata<T> {
    const metadata = new Metadata(signed);
    metadata.sign(
      (data) =>
        new Signature({
          keyID: signer.key.keyID,
          sig: crypto.sign(null, data, signer.privateKey).toString('hex'),
        })
    );
    return metadata;
  }

  function setupRepo(sharedKey: boolean) {
    const expires = new Date(Date.now() + 86400000).toISOString();
    const common = { version: 1, specVersion: '1.0.0', expires };
    const root = new Root({ ...common, consistentSnapshot: false });
    ['root', 'timestamp', 'snapshot', 'targets'].forEach((role) =>
      root.addKey(keys[0].key, role)
    );
    fs.writeFileSync(
      path.join(metadataDir, 'root.json'),
      JSON.stringify(sign(root))
    );

    const delegates = (
      roles: { name: string; key: Key; paths: string[] }[]
    ): Targets =>
      Targets.fromJSON({
        _type: 'targets',
        version: 1,
        spec_version: '1.0.0',
        expires,
        targets: {},
        delegations: {
          keys: Object.fromEntries(
            roles.map(({ key }) => [key.keyID, key.toJSON()])
          ),
          roles: roles.map(({ name, key, paths }) => ({
            name,
            keyids: [key.keyID],
            threshold: 1,
            terminating: false,
            paths,
          })),
        },
      });

    const roles = {
      targets: sign(
        delegates(
          ['a', 'b'].map((branch) => ({
            name: `parent-${branch}`,
            key: keys[0].key,
            paths: [`team-${branch}/*`],
          }))
        )
      ),
      'parent-a': sign(
        delegates([{ name: 'release', key: keys[0].key, paths: ['team-a/*'] }])
      ),
      'parent-b': sign(
        delegates([
          {
            name: 'release',
            key: keys[sharedKey ? 0 : 1].key,
            paths: ['team-b/*'],
          },
        ])
      ),
      release: sign(
        Targets.fromJSON({
          _type: 'targets',
          version: 1,
          spec_version: '1.0.0',
          expires,
          targets: {
            'team-a/file.txt': { length: 1, hashes: { sha256: 'a' } },
            'team-b/file.txt': { length: 1, hashes: { sha256: 'b' } },
          },
        })
      ),
    };
    const snapshot = sign(
      new Snapshot({
        ...common,
        meta: Object.fromEntries(
          Object.keys(roles).map((role) => [
            `${role}.json`,
            new MetaFile({ version: 1 }),
          ])
        ),
      })
    );
    const timestamp = sign(
      new Timestamp({ ...common, snapshotMeta: new MetaFile({ version: 1 }) })
    );

    const responses = new Map(
      Object.entries({ timestamp, snapshot, ...roles }).map(
        ([role, metadata]) => [
          `${baseURL}/metadata/${role}.json`,
          Buffer.from(JSON.stringify(metadata.toJSON())),
        ]
      )
    );
    const downloadBytes = jest.fn<
      ReturnType<Fetcher['downloadBytes']>,
      Parameters<Fetcher['downloadBytes']>
    >((url) => {
      if (url === `${baseURL}/metadata/2.root.json`) {
        return Promise.reject(new DownloadHTTPError('Root not found', 404));
      }
      const response = responses.get(url);
      if (!response) {
        return Promise.reject(new Error(`Unexpected metadata request: ${url}`));
      }
      responses.delete(url);
      return Promise.resolve(response);
    });
    const fetcher: Fetcher = {
      downloadBytes,
      downloadFile: () =>
        Promise.reject(new Error('Unexpected artifact download')),
    };

    return {
      updater: new Updater({
        metadataDir,
        metadataBaseUrl: `${baseURL}/metadata`,
        fetcher,
      }),
      downloadBytes,
    };
  }

  it('rejects cached metadata not signed by the current delegator', async () => {
    const { updater, downloadBytes } = setupRepo(false);
    await expect(
      updater.getTargetInfo('team-a/file.txt')
    ).resolves.toHaveProperty('path', 'team-a/file.txt');
    await expect(updater.getTargetInfo('team-b/file.txt')).rejects.toThrow(
      'release was signed by 0/1 keys'
    );
    await expect(
      updater.getTargetInfo('team-a/file.txt')
    ).resolves.toHaveProperty('path', 'team-a/file.txt');
    expect(downloadBytes).toHaveBeenCalledTimes(7);
  });

  it('reuses cached metadata authorized by both delegators without refetching', async () => {
    const { updater, downloadBytes } = setupRepo(true);
    for (const target of ['team-a/file.txt', 'team-b/file.txt']) {
      await expect(updater.getTargetInfo(target)).resolves.toHaveProperty(
        'path',
        target
      );
    }
    expect(downloadBytes).toHaveBeenCalledTimes(7);
  });
});
