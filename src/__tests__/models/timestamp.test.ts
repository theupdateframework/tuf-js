import { MetaFile } from '../../models/file';
import { Timestamp } from '../../models/timestamp';

describe('Timestamp', () => {
  describe('constructor', () => {
    const metaFile = new MetaFile({
      version: 1,
      length: 1,
      hashes: { sha256: 'a' },
    });

    const opts = {
      version: 1,
      specVersion: '1.0.0',
      expires: '1970-01-01T00:00:01.000Z',
      snapshotMeta: metaFile,
      unrecognizedFields: { foo: 'bar' },
    };

    describe('when called with valid arguments', () => {
      it('constructs an object', () => {
        const snapshot = new Timestamp(opts);
        expect(snapshot).toBeTruthy();
        expect(snapshot.version).toEqual(opts.version);
        expect(snapshot.specVersion).toEqual(opts.specVersion);
        expect(snapshot.expires).toEqual(opts.expires);
        expect(snapshot.snapshotMeta).toEqual(opts.snapshotMeta);
        expect(snapshot.unrecognizedFields).toEqual(opts.unrecognizedFields);
      });
    });

    describe('when called with a missing meta property', () => {
      it('constructs an object', () => {
        const snapshot = new Timestamp({ ...opts, snapshotMeta: undefined });
        expect(snapshot).toBeTruthy();
        expect(snapshot.version).toEqual(opts.version);
        expect(snapshot.specVersion).toEqual(opts.specVersion);
        expect(snapshot.expires).toEqual(opts.expires);
        expect(snapshot.snapshotMeta).toEqual(new MetaFile({ version: 1 }));
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
      snapshotMeta: metaFileV1,
    };

    const timestamp = new Timestamp(opts);

    describe('when called with a different object', () => {
      it('returns false', () => {
        expect(timestamp.equals({} as Timestamp)).toEqual(false);
      });
    });

    describe('when called with the same object', () => {
      it('returns true', () => {
        expect(timestamp.equals(timestamp)).toEqual(true);
      });
    });

    describe('when called with an object with the same properties', () => {
      it('returns true', () => {
        const other = new Timestamp(opts);
        expect(timestamp.equals(other)).toEqual(true);
      });
    });

    describe('when called with an object with different version', () => {
      it('returns false', () => {
        const other = new Timestamp({
          ...opts,
          version: 2,
        });
        expect(timestamp.equals(other)).toEqual(false);
      });
    });

    describe('when called with an object with different meta', () => {
      const metaFileV2 = new MetaFile({
        version: 2,
        length: 1,
        hashes: { sha256: 'a' },
      });

      it('returns false', () => {
        const other = new Timestamp({
          ...opts,
          snapshotMeta: metaFileV2,
        });
        expect(timestamp.equals(other)).toEqual(false);
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
      snapshotMeta: metaFile,
      unrecognizedFields: { foo: 'bar' },
    };

    const timestamp = new Timestamp(opts);

    it('returns the expected JSON', () => {
      expect(timestamp.toJSON()).toEqual({
        _type: 'timestamp',
        version: 1,
        spec_version: '1.0.0',
        expires: '1970-01-01T00:00:01.000Z',
        meta: { 'snapshot.json': metaFile.toJSON() },
        foo: 'bar',
      });
    });
  });

  describe('.fromJSON', () => {
    const json = {
      version: 1,
      spec_version: '1.0.0',
      expires: '1970-01-01T00:00:01.000Z',
      meta: {
        'snapshot.json': { version: 1, length: 1, hashes: { sha256: 'a' } },
      },
      foo: 'bar',
    };

    describe('when snapshot.json is missing', () => {
      it('throws an error', () => {
        expect(() => Timestamp.fromJSON({ ...json, meta: {} })).toThrow(
          TypeError
        );
      });
    });

    describe('when the JSON is valid', () => {
      it('returns the expected object', () => {
        const timestamp = Timestamp.fromJSON(json);

        expect(timestamp).toBeTruthy();
        expect(timestamp.version).toEqual(json.version);
        expect(timestamp.specVersion).toEqual(json.spec_version);
        expect(timestamp.expires).toEqual(json.expires);
        expect(timestamp.snapshotMeta).toEqual(
          MetaFile.fromJSON(json.meta['snapshot.json'])
        );
        expect(timestamp.unrecognizedFields).toEqual({ foo: 'bar' });
      });
    });
  });
});
