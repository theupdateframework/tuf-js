import { MetaFile } from '../file';
import { Snapshot } from '../snapshot';

describe('Snapshot', () => {
  describe('constructor', () => {
    const opts = {
      version: 1,
      specVersion: '1.0.0',
      expires: '1970-01-01T00:00:01.000Z',
      unrecognizedFields: { foo: 'bar' },
    };

    describe('when called with all arguments', () => {
      const metaFile = new MetaFile({
        version: 1,
        length: 1,
        hashes: { sha256: 'a' },
      });
      const meta = { 'foo.txt': metaFile };

      it('constructs an object', () => {
        const snapshot = new Snapshot({ ...opts, meta });
        expect(snapshot).toBeTruthy();
        expect(snapshot.version).toEqual(opts.version);
        expect(snapshot.specVersion).toEqual(opts.specVersion);
        expect(snapshot.expires).toEqual(opts.expires);
        expect(snapshot.meta).toEqual(meta);
        expect(snapshot.unrecognizedFields).toEqual(opts.unrecognizedFields);
      });
    });

    describe('when called without meta arg', () => {
      it('constructs an object', () => {
        const snapshot = new Snapshot(opts);
        expect(snapshot).toBeTruthy();
        expect(snapshot.version).toEqual(opts.version);
        expect(snapshot.specVersion).toEqual(opts.specVersion);
        expect(snapshot.expires).toEqual(opts.expires);
        expect(snapshot.meta).toEqual({
          'targets.json': new MetaFile({ version: 1 }),
        });
        expect(snapshot.unrecognizedFields).toEqual(opts.unrecognizedFields);
      });
    });
  });

  describe('#equals', () => {
    const metaFileV1 = new MetaFile({
      version: 1,
      length: 1,
      hashes: { sha256: 'a' },
    });

    const opts = {
      version: 1,
      specVersion: '1.0.0',
      expires: '1970-01-01T00:00:01.000Z',
      meta: { 'foo.txt': metaFileV1 },
    };

    const snapshot = new Snapshot(opts);

    describe('when called with a different object', () => {
      it('returns false', () => {
        expect(snapshot.equals({} as Snapshot)).toEqual(false);
      });
    });

    describe('when called with the same object', () => {
      it('returns true', () => {
        expect(snapshot.equals(snapshot)).toEqual(true);
      });
    });

    describe('when called with an object with the same properties', () => {
      it('returns true', () => {
        const other = new Snapshot(opts);
        expect(snapshot.equals(other)).toEqual(true);
      });
    });

    describe('when called with an object with different version', () => {
      it('returns false', () => {
        const other = new Snapshot({
          ...opts,
          version: 2,
        });
        expect(snapshot.equals(other)).toEqual(false);
      });
    });

    describe('when called with an object with different meta', () => {
      const metaFileV2 = new MetaFile({
        version: 2,
        length: 1,
        hashes: { sha256: 'a' },
      });

      it('returns false', () => {
        const other = new Snapshot({
          ...opts,
          meta: { 'foo.txt': metaFileV2 },
        });
        expect(snapshot.equals(other)).toEqual(false);
      });
    });
  });

  describe('#toJSON', () => {
    const metaFile = new MetaFile({
      version: 1,
      length: 1,
      hashes: { sha256: 'a' },
    });

    const opts = {
      version: 1,
      specVersion: '1.0.0',
      expires: '1970-01-01T00:00:01.000Z',
      meta: { 'foo.txt': metaFile },
      unrecognizedFields: { foo: 'bar' },
    };

    const snapshot = new Snapshot(opts);

    it('returns the expected JSON', () => {
      expect(snapshot.toJSON()).toEqual({
        _type: 'snapshot',
        version: 1,
        spec_version: '1.0.0',
        expires: '1970-01-01T00:00:01.000Z',
        meta: { 'foo.txt': metaFile.toJSON() },
        foo: 'bar',
      });
    });
  });

  describe('.fromJSON', () => {
    const json = {
      version: 1,
      spec_version: '1.0.0',
      expires: '1970-01-01T00:00:01.000Z',
      meta: { 'foo.txt': { version: 1, length: 1, hashes: { sha256: 'a' } } },
      foo: 'bar',
    };

    describe('when the meta field is malformed', () => {
      it('throws an error', () => {
        expect(() => Snapshot.fromJSON({ ...json, meta: 'foo' })).toThrow(
          TypeError
        );
      });
    });

    describe('when the JSON is valid', () => {
      it('returns the expected object', () => {
        const snapshot = Snapshot.fromJSON(json);

        expect(snapshot).toBeTruthy();
        expect(snapshot.version).toEqual(json.version);
        expect(snapshot.specVersion).toEqual(json.spec_version);
        expect(snapshot.expires).toEqual(json.expires);

        expect(Object.entries(snapshot.meta).length).toEqual(1);
        expect(snapshot.meta).toHaveProperty(['foo.txt']);

        const metafile = snapshot.meta['foo.txt'];
        expect(metafile.version).toEqual(json.meta['foo.txt'].version);
        expect(metafile.length).toEqual(json.meta['foo.txt'].length);
        expect(metafile.hashes).toEqual(json.meta['foo.txt'].hashes);

        expect(snapshot.unrecognizedFields).toEqual({ foo: 'bar' });
      });
    });
  });
});
