import { ValueError } from '../error';
import { Key } from '../key';
import { Role } from '../role';
import { Root, RootOptions } from '../root';

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
        expect(root.consistentSnapshot).toEqual(true);
      });
    });

    describe('when called with a missing role', () => {
      const opts: RootOptions = {
        version: 1,
        specVersion: '1.0.0',
        expires: '2020-01-01T00:00:00.000Z',
        consistentSnapshot: false,
        keys: { abc: emptyKey },
        roles: {
          root: emptyRole,
          timestamp: emptyRole,
          targets: emptyRole,
        },
      };

      it('throws an error', () => {
        expect(() => {
          new Root(opts);
        }).toThrow(ValueError);
      });
    });
  });

  describe('#addKey', () => {
    const key = new Key({
      keyID: 'foo',
      keyType: 'ed25519',
      keyVal: { public: '' },
      scheme: 'ed25519',
    });

    const root = new Root({});

    describe('when called with a valid role', () => {
      it('adds the key', () => {
        root.addKey(key, 'timestamp');

        expect(root.keys).toHaveProperty(key.keyID);
        expect(root.keys[key.keyID]).toEqual(key);

        expect(root.roles.timestamp.keyIDs).toContain(key.keyID);
      });
    });

    describe('when called with an invalid role', () => {
      it('throws an error', () => {
        expect(() => root.addKey(key, 'invalid')).toThrow(ValueError);
      });
    });
  });

  describe('#equals', () => {
    const emptyRole = new Role({ keyIDs: [], threshold: 1 });
    const emptyKey = new Key({
      keyID: 'foo',
      keyType: 'ed25519',
      keyVal: { public: '' },
      scheme: 'ed25519',
    });
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
    const root = new Root(opts);

    describe('when called with an equivalent object', () => {
      it('returns true', () => {
        const other = new Root(opts);
        expect(root.equals(other)).toEqual(true);
      });
    });

    describe('when called with the same object', () => {
      it('returns true', () => {
        expect(root.equals(root)).toEqual(true);
      });
    });

    describe('when called with a different object', () => {
      it('returns false', () => {
        expect(root.equals({} as Root)).toEqual(false);
      });
    });

    describe('when called with an object with a different version', () => {
      it('returns false', () => {
        const other = new Root({ ...opts, version: 2 });
        expect(root.equals(other)).toEqual(false);
      });
    });

    describe('when called with an object with a different consistentSnapshot', () => {
      it('returns false', () => {
        const other = new Root({ ...opts, consistentSnapshot: true });
        expect(root.equals(other)).toEqual(false);
      });
    });

    describe('when called with an object with a different keys', () => {
      it('returns false', () => {
        const other = new Root({ ...opts, keys: { def: emptyKey } });
        expect(root.equals(other)).toEqual(false);
      });
    });

    describe('when called with an object with a different roles', () => {
      const otherRole = new Role({ keyIDs: [], threshold: 2 });
      const otherRoles = {
        root: emptyRole,
        timestamp: emptyRole,
        snapshot: emptyRole,
        targets: otherRole,
      };

      it('returns false', () => {
        const other = new Root({ ...opts, roles: otherRoles });
        expect(root.equals(other)).toEqual(false);
      });
    });
  });

  describe('#toJSON', () => {
    const emptyRole = new Role({ keyIDs: [], threshold: 1 });
    const emptyKey = new Key({
      keyID: 'foo',
      keyType: 'ed25519',
      keyVal: { public: '' },
      scheme: 'ed25519',
    });
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
    const root = new Root(opts);

    it('returns a JSON representation', () => {
      expect(root.toJSON()).toEqual({
        _type: 'root',
        version: 1,
        spec_version: '1.0.0',
        expires: '2020-01-01T00:00:00.000Z',
        consistent_snapshot: false,
        keys: { abc: emptyKey.toJSON() },
        roles: {
          root: emptyRole.toJSON(),
          timestamp: emptyRole.toJSON(),
          snapshot: emptyRole.toJSON(),
          targets: emptyRole.toJSON(),
        },
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

    describe('when there is a type error with consistent_snapshot', () => {
      it('throws an error', () => {
        expect(() => {
          Root.fromJSON({ ...json, consistent_snapshot: 'foo' });
        }).toThrow(TypeError);
      });
    });

    describe('when there is a type error with keys', () => {
      it('throws an error', () => {
        expect(() => {
          Root.fromJSON({ ...json, keys: 'foo' });
        }).toThrow(TypeError);
      });
    });

    describe('when there is a type error with roles', () => {
      it('throws an error', () => {
        expect(() => {
          Root.fromJSON({ ...json, roles: 'foo' });
        }).toThrow(TypeError);
      });
    });

    describe('when the JSON is valid', () => {
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
});
