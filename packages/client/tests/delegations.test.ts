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
import nock from 'nock';
import os from 'os';
import path from 'path';
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
    nock.cleanAll();
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

  function setupRepo(sharedKey: boolean): Updater {
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

    const server = nock(baseURL)
      .get('/metadata/2.root.json')
      .reply(404)
      .get('/metadata/timestamp.json')
      .reply(200, timestamp.toJSON())
      .get('/metadata/snapshot.json')
      .reply(200, snapshot.toJSON());
    Object.entries(roles).forEach(([role, metadata]) =>
      server.get(`/metadata/${role}.json`).reply(200, metadata.toJSON())
    );

    return new Updater({
      metadataDir,
      metadataBaseUrl: `${baseURL}/metadata`,
      config: { fetchRetry: 0 },
    });
  }

  it('rejects cached metadata not signed by the current delegator', async () => {
    const updater = setupRepo(false);
    await expect(
      updater.getTargetInfo('team-a/file.txt')
    ).resolves.toHaveProperty('path', 'team-a/file.txt');
    await expect(updater.getTargetInfo('team-b/file.txt')).rejects.toThrow(
      'release was signed by 0/1 keys'
    );
    await expect(
      updater.getTargetInfo('team-a/file.txt')
    ).resolves.toHaveProperty('path', 'team-a/file.txt');
    expect(nock.isDone()).toBe(true);
  });

  it('reuses cached metadata authorized by both delegators without refetching', async () => {
    const updater = setupRepo(true);
    for (const target of ['team-a/file.txt', 'team-b/file.txt']) {
      await expect(updater.getTargetInfo(target)).resolves.toHaveProperty(
        'path',
        target
      );
    }
    expect(nock.isDone()).toBe(true);
  });
});
