import { Metadata, MetadataKind } from '@tufjs/models';
import fs from 'fs';
import http from 'http';
import tufmock, { clearMock, mockRepo } from '../src/index';

describe('mockRepo', () => {
  const baseURL = 'http://localhost:8000';
  const targetFile = {
    name: 'foo.txt',
    content: 'foo',
  };

  afterEach(() => clearMock());

  it('returns the root metadata file', () => {
    const rootMeta = mockRepo(baseURL, []);
    expect(rootMeta).toBeTruthy();
  });

  it('mocks the metadata endpoints', async () => {
    // Set-up mock and retrieve root
    const rootJSON = mockRepo(baseURL, []);
    expect(rootJSON).toBeTruthy();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const rootMeta = Metadata.fromJSON(MetadataKind.Root, JSON.parse(rootJSON));
    expect(rootMeta).toBeTruthy();
    expect(() => rootMeta.verifyDelegate('root', rootMeta)).not.toThrow();

    // Retrieve the timestamp metadata file
    const timestampJSON = await fetch(`${baseURL}/metadata/timestamp.json`);
    const timestampMeta = Metadata.fromJSON(
      MetadataKind.Timestamp,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      JSON.parse(timestampJSON)
    );
    expect(timestampMeta).toBeTruthy();
    expect(() =>
      rootMeta.verifyDelegate('timestamp', timestampMeta)
    ).not.toThrow();

    // Retrieve the snapshot metadata file
    const snapshotJSON = await fetch(`${baseURL}/metadata/snapshot.json`);
    const snapshotMeta = Metadata.fromJSON(
      MetadataKind.Snapshot,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      JSON.parse(snapshotJSON)
    );
    expect(snapshotMeta).toBeTruthy();
    expect(() =>
      rootMeta.verifyDelegate('snapshot', snapshotMeta)
    ).not.toThrow();

    // Retrieve the targets metadata file
    const targetsJSON = await fetch(`${baseURL}/metadata/targets.json`);
    const targetsMeta = Metadata.fromJSON(
      MetadataKind.Targets,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      JSON.parse(targetsJSON)
    );
    expect(targetsMeta).toBeTruthy();
    expect(() => rootMeta.verifyDelegate('targets', targetsMeta)).not.toThrow();

    // There is only one version of the root metadata file. Requests for
    // version 2 should return a 404.
    await expect(fetch(`${baseURL}/metadata/2.root.json`)).rejects.toThrow(
      /404/
    );

    // No mock should be set-up for the 1.root.json file as this should never be
    // fetched in a normal TUF flow.
    await expect(fetch(`${baseURL}/metadata/1.root.json`)).rejects.toThrow(
      /No match for request/
    );
  });

  it('mocks the targets endpoints', async () => {
    mockRepo(baseURL, [targetFile]);
    const target = await fetch(`${baseURL}/targets/foo.txt`);
    expect(target).toEqual(targetFile.content);
  });
});

describe('default', () => {
  const subject = tufmock([]);

  it('creates a cache directory', () => {
    expect(subject.cachePath).toBeTruthy();

    const stat = fs.statSync(subject.cachePath);
    expect(stat.isDirectory()).toBeTruthy();
  });

  it('inits the cache directory with the root metadata', () => {
    const rootPath = `${subject.cachePath}/root.json`;
    const stat = fs.statSync(rootPath);
    expect(stat.isFile()).toBeTruthy();
  });

  describe('teardown', () => {
    it('removes the cache directory', () => {
      subject.teardown();

      expect(() => fs.statSync(subject.cachePath)).toThrow();
    });
  });
});

async function fetch(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Status code: ${res.statusCode}`));
        }
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve(body);
        });
        res.on('error', (err) => {
          reject(err);
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}
