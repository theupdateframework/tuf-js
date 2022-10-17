import { Root, RootOptions } from './root';
import { Role } from './role';
import { Key } from './key';

describe('Root', () => {
  describe('constructor', () => {
    const emptyRole = new Role({ keyIDs: [], threshold: 1 });
    const emptyKey = new Key({
      keyID: 'foo',
      keyType: 'ed25519',
      keyVal: { public: '' },
      scheme: 'ed25519',
    });

    describe('when called with valid arguments', () => {
      const opts: RootOptions = {
        version: 1,
        specVersion: '1.0.0',
        expires: '2020-01-01T00:00:00.000Z',
        consistentSnapshot: false,
        keys: { abc: emptyKey },
        roles: {
          root: emptyRole,
          timestamp: emptyRole,
          snapshot: emptyRole,
          targets: emptyRole,
        },
      };

      it('constructs an object', () => {
        const root = new Root(opts);
        expect(root).toBeTruthy();
        expect(root.version).toEqual(opts.version);
        expect(root.specVersion).toEqual(opts.specVersion);
        expect(root.expires).toEqual(opts.expires);
        expect(root.keys).toEqual(opts.keys);
        expect(root.roles).toEqual(opts.roles);
        expect(root.consistentSnapshot).toEqual(opts.consistentSnapshot);
      });
    });

    describe('when called with missing arguments', () => {
      const opts: RootOptions = {
        version: 1,
        specVersion: '1.0.0',
        expires: '2020-01-01T00:00:00.000Z',
        consistentSnapshot: false,
      };

      it('constructs an object with default options', () => {
        const root = new Root(opts);
        expect(root).toBeTruthy();
        expect(root.version).toEqual(opts.version);
        expect(root.specVersion).toEqual(opts.specVersion);
        expect(root.expires).toEqual(opts.expires);
        expect(root.keys).toEqual({});
        expect(root.roles).toEqual({
          root: emptyRole,
          timestamp: emptyRole,
          snapshot: emptyRole,
          targets: emptyRole,
        });
        expect(root.consistentSnapshot).toEqual(opts.consistentSnapshot);
      });
    });
  });

  describe('fromJSON', () => {
    const json = {
      _type: 'root',
      version: 1,
      spec_version: '1.0.0',
      expires: '2020-01-01T00:00:00.000Z',
      consistent_snapshot: false,
      keys: {
        abc: {
          keyid_hash_algorithms: ['sha256', 'sha512'],
          keytype: 'ed25519',
          keyval: {
            public: 'foo',
          },
          scheme: 'ed25519',
        },
      },
      roles: {
        root: { keyids: ['xyz'], threshold: 1 },
        timestamp: { keyids: [], threshold: 1 },
        snapshot: { keyids: [], threshold: 1 },
        targets: { keyids: [], threshold: 1 },
      },
    };

    it('constructs an object', () => {
      const root = Root.fromJSON(json);
      expect(root).toBeTruthy();
      expect(root.version).toEqual(json.version);
      expect(root.specVersion).toEqual(json.spec_version);
      expect(root.expires).toEqual(json.expires);
      expect(root.keys).toHaveProperty('abc');

      expect(root.roles).toHaveProperty('root');
      expect(root.roles['root'].keyIDs).toEqual(json.roles.root.keyids);
      expect(root.roles['root'].threshold).toEqual(json.roles.root.threshold);

      expect(root.roles).toHaveProperty('timestamp');
      expect(root.roles).toHaveProperty('snapshot');
      expect(root.roles).toHaveProperty('targets');

      expect(root.consistentSnapshot).toEqual(json.consistent_snapshot);
    });
  });
});
