import { ValueError } from '../error';
import { DelegatedRole, Role } from './role';

describe('Role', () => {
  describe('constructor', () => {
    describe('when called with valid arguments', () => {
      const opts = { keyIDs: ['a'], threshold: 2 };
      it('constructs an object', () => {
        const role = new Role(opts);
        expect(role).toBeTruthy();
        expect(role.keyIDs).toEqual(opts.keyIDs);
        expect(role.threshold).toEqual(opts.threshold);
      });
    });

    describe('when called with duplicate key IDs', () => {
      const opts = { keyIDs: ['a', 'a'], threshold: 1 };
      it('throws an error', () => {
        expect(() => new Role(opts)).toThrow(ValueError);
      });
    });

    describe('when called with threshold less than 1', () => {
      const opts = { keyIDs: [], threshold: 0 };
      it('throws an error', () => {
        expect(() => new Role(opts)).toThrow(ValueError);
      });
    });
  });

  describe('fromJSON', () => {
    describe('when keyids is not an array', () => {
      const json = { keyids: 'a', threshold: 1 };
      it('throws an error', () => {
        expect(() => Role.fromJSON(json)).toThrowError(TypeError);
      });
    });

    describe('when threshold is not a number', () => {
      const json = { keyids: [], threshold: 'foo' };
      it('throws an error', () => {
        expect(() => Role.fromJSON(json)).toThrowError(TypeError);
      });
    });

    describe('when called with valid arguments', () => {
      const json = { keyids: ['a'], threshold: 1 };
      it('constructs an object', () => {
        const role = Role.fromJSON(json);
        expect(role).toBeTruthy();
        expect(role.keyIDs).toEqual(json.keyids);
        expect(role.threshold).toEqual(json.threshold);
      });
    });
  });

  describe('equals', () => {
    const opts = {
      keyIDs: ['a'],
      threshold: 1,
      unrecognizedFields: { foo: 'bar' },
    };
    const role = new Role(opts);

    describe('when called with a non-Role object', () => {
      it('returns false', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(role.equals({} as any)).toBeFalsy();
      });
    });

    describe('when called with a Role object with different key IDs', () => {
      const other = new Role({ ...opts, keyIDs: ['b'] });
      it('returns false', () => {
        expect(role.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a Role object with different threshold', () => {
      const other = new Role({ ...opts, threshold: 2 });
      it('returns false', () => {
        expect(role.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a Role object with different unrecognized fields', () => {
      const other = new Role({ ...opts, unrecognizedFields: { bar: 'foo' } });
      it('returns false', () => {
        expect(role.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a Role object with the same properties', () => {
      const other = new Role(opts);
      it('returns true', () => {
        expect(role.equals(other)).toBeTruthy();
      });
    });
  });
});

describe('DelegatedRole', () => {
  describe('constructor', () => {
    const opts = {
      name: 'foo',
      keyIDs: ['x'],
      threshold: 2,
      terminating: true,
      unrecognizedFields: { foo: 'bar' },
    };

    describe('when called with paths', () => {
      const paths = ['a', 'b'];

      it('constructs an object', () => {
        const role = new DelegatedRole({ ...opts, paths });
        expect(role).toBeTruthy();
        expect(role.name).toEqual(opts.name);
        expect(role.keyIDs).toEqual(opts.keyIDs);
        expect(role.threshold).toEqual(opts.threshold);
        expect(role.terminating).toEqual(opts.terminating);
        expect(role.paths).toEqual(paths);
        expect(role.unrecognizedFields).toEqual(opts.unrecognizedFields);
      });
    });

    describe('when called with pathHashPrefixes', () => {
      const pathHashPrefixes = ['a', 'b'];

      it('constructs an object', () => {
        const role = new DelegatedRole({ ...opts, pathHashPrefixes });
        expect(role).toBeTruthy();
        expect(role.name).toEqual(opts.name);
        expect(role.keyIDs).toEqual(opts.keyIDs);
        expect(role.threshold).toEqual(opts.threshold);
        expect(role.terminating).toEqual(opts.terminating);
        expect(role.pathHashPrefixes).toEqual(pathHashPrefixes);
        expect(role.unrecognizedFields).toEqual(opts.unrecognizedFields);
      });
    });

    describe('when called with paths and pathHashPrefixes', () => {
      const paths = ['a', 'b'];
      const pathHashPrefixes = ['a', 2];
      it('throws an error', () => {
        expect(() => {
          new DelegatedRole({
            ...opts,
            paths,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pathHashPrefixes: pathHashPrefixes as any,
          });
        }).toThrowError(ValueError);
      });
    });
  });

  describe('#equals', () => {
    const opts = {
      name: 'foo',
      keyIDs: ['x'],
      threshold: 2,
      terminating: true,
      unrecognizedFields: { foo: 'bar' },
    };
    const role = new DelegatedRole(opts);

    describe('when called with a non-DelegatedRole object', () => {
      it('returns false', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(role.equals({} as any)).toBeFalsy();
      });
    });

    describe('when called with a DelegatedRole object with different name', () => {
      const other = new DelegatedRole({ ...opts, name: 'bar' });
      it('returns false', () => {
        expect(role.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a DelegatedRole object with different key IDs', () => {
      const other = new DelegatedRole({ ...opts, keyIDs: ['y'] });
      it('returns false', () => {
        expect(role.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a DelegatedRole object with different threshold', () => {
      const other = new DelegatedRole({ ...opts, threshold: 3 });
      it('returns false', () => {
        expect(role.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a DelegatedRole object with different terminating', () => {
      const other = new DelegatedRole({ ...opts, terminating: false });
      it('returns false', () => {
        expect(role.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a DelegatedRole object with different paths', () => {
      const other = new DelegatedRole({ ...opts, paths: ['a'] });
      it('returns false', () => {
        expect(role.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a DelegatedRole object with different pathHashPrefixes', () => {
      const other = new DelegatedRole({ ...opts, pathHashPrefixes: ['a'] });
      it('returns false', () => {
        expect(role.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a DelegatedRole object with different unrecognized fields', () => {
      const other = new DelegatedRole({
        ...opts,
        unrecognizedFields: { bar: 'foo' },
      });
      it('returns false', () => {
        expect(role.equals(other)).toBeFalsy();
      });
    });
  });

  describe('#isDelegatedPath', () => {
    const opts = {
      name: 'foo',
      keyIDs: ['x'],
      threshold: 1,
      terminating: true,
    };

    describe('when neither paths nor pathHashPrefixes are set', () => {
      const role = new DelegatedRole(opts);

      it('returns false', () => {
        expect(role.isDelegatedPath('a')).toBeFalsy();
      });
    });

    describe('when paths are set', () => {
      const paths = ['a', 'b/c/*.txt'];
      const role = new DelegatedRole({ ...opts, paths });

      describe('when target path is an exact match', () => {
        const targetPath = 'a';
        it('returns true', () => {
          expect(role.isDelegatedPath(targetPath)).toBeTruthy();
        });
      });

      describe('when target path is a glob match', () => {
        const targetPath = 'b/c/d.txt';
        it('returns true', () => {
          expect(role.isDelegatedPath(targetPath)).toBeTruthy();
        });
      });

      describe('when target path is not a match', () => {
        const targetPath = 'e';
        it('returns false', () => {
          expect(role.isDelegatedPath(targetPath)).toBeFalsy();
        });
      });

      describe('when target path almost matches', () => {
        const targetPath = 'b/c/d/e.txt';
        it('returns false', () => {
          expect(role.isDelegatedPath(targetPath)).toBeFalsy();
        });
      });
    });

    describe('when pathHashPrefixes are set', () => {
      const pathHashPrefixes = ['abcd', 'ca97'];
      const role = new DelegatedRole({ ...opts, pathHashPrefixes });

      describe('when target path is a match', () => {
        const targetPath = 'a';
        it('returns true', () => {
          expect(role.isDelegatedPath(targetPath)).toBeTruthy();
        });
      });

      describe('when target path is NOT a match', () => {
        const targetPath = 'b';
        it('returns false', () => {
          expect(role.isDelegatedPath(targetPath)).toBeFalsy();
        });
      });
    });
  });

  describe('#toJSON', () => {
    const opts = {
      name: 'foo',
      keyIDs: ['x'],
      threshold: 1,
      terminating: true,
      unrecognizedFields: { foo: 'bar' },
    };
    const role = new DelegatedRole(opts);

    describe('when there are no paths or pathHashPrefixes', () => {
      it('returns the expected JSON', () => {
        expect(role.toJSON()).toEqual({
          name: opts.name,
          keyids: opts.keyIDs,
          threshold: opts.threshold,
          terminating: opts.terminating,
          foo: 'bar',
        });
      });
    });

    describe('when there are paths', () => {
      const paths = ['a', 'b/c/*.txt'];
      const role = new DelegatedRole({ ...opts, paths });

      it('returns the expected JSON', () => {
        expect(role.toJSON()).toEqual({
          name: opts.name,
          keyids: opts.keyIDs,
          threshold: opts.threshold,
          terminating: opts.terminating,
          paths,
          foo: 'bar',
        });
      });
    });

    describe('when there are pathHashPrefixes', () => {
      const pathHashPrefixes = ['abcd', 'ca97'];
      const role = new DelegatedRole({ ...opts, pathHashPrefixes });

      it('returns the expected JSON', () => {
        expect(role.toJSON()).toEqual({
          name: opts.name,
          keyids: opts.keyIDs,
          threshold: opts.threshold,
          terminating: opts.terminating,
          path_hash_prefixes: pathHashPrefixes,
          foo: 'bar',
        });
      });
    });
  });

  describe('.fromJSON', () => {
    const json = {
      name: 'foo',
      keyids: ['x'],
      threshold: 1,
      terminating: true,
      foo: 'bar',
    };

    describe('when there is a type error with keyids', () => {
      it('throws a TypeError', () => {
        expect(() =>
          DelegatedRole.fromJSON({ ...json, keyids: 1 })
        ).toThrowError(TypeError);
      });
    });

    describe('when there is a type error with threshold', () => {
      it('throws a TypeError', () => {
        expect(() =>
          DelegatedRole.fromJSON({ ...json, threshold: 'a' })
        ).toThrowError(TypeError);
      });
    });

    describe('when there is a type error with name', () => {
      it('throws a TypeError', () => {
        expect(() =>
          DelegatedRole.fromJSON({ ...json, name: 99 })
        ).toThrowError(TypeError);
      });
    });

    describe('when there is a type error with terminating', () => {
      it('throws a TypeError', () => {
        expect(() =>
          DelegatedRole.fromJSON({ ...json, terminating: 'yes' })
        ).toThrowError(TypeError);
      });
    });

    describe('when paths is defined', () => {
      describe('when there is a type error with paths', () => {
        it('throws a TypeError', () => {
          expect(() =>
            DelegatedRole.fromJSON({ ...json, paths: 1 })
          ).toThrowError(TypeError);
        });
      });

      describe('when there is a type error internal to paths', () => {
        it('throws a TypeError', () => {
          expect(() =>
            DelegatedRole.fromJSON({ ...json, paths: ['a', 2] })
          ).toThrowError(TypeError);
        });
      });

      describe('when paths is an empty array', () => {
        it('returns the expected DelegatedRole', () => {
          const role = DelegatedRole.fromJSON({ ...json, paths: [] });
          expect(role.paths).toEqual([]);
        });
      });
    });

    describe('when path_hash_prefixes is defined', () => {
      describe('when there is a type error with path_hash_prefixes', () => {
        it('throws a TypeError', () => {
          expect(() =>
            DelegatedRole.fromJSON({ ...json, path_hash_prefixes: 1 })
          ).toThrowError(TypeError);
        });
      });

      describe('when there is a type error internal to path_hash_prefixes', () => {
        it('throws a TypeError', () => {
          expect(() =>
            DelegatedRole.fromJSON({ ...json, path_hash_prefixes: ['a', 2] })
          ).toThrowError(TypeError);
        });
      });

      describe('when path_hash_prefixes is is an empty array', () => {
        it('returns the expected DelegatedRole', () => {
          const role = DelegatedRole.fromJSON({
            ...json,
            path_hash_prefixes: [],
          });
          expect(role.pathHashPrefixes).toEqual([]);
        });
      });
    });

    describe('when the JSON is valid', () => {
      it('returns the expected DelegatedRole', () => {
        const pathHashPrefixes = ['abcd', 'ca97'];
        const role = DelegatedRole.fromJSON({
          ...json,
          path_hash_prefixes: pathHashPrefixes,
        });

        expect(role).toBeTruthy();
        expect(role.name).toEqual(json.name);
        expect(role.keyIDs).toEqual(json.keyids);
        expect(role.threshold).toEqual(json.threshold);
        expect(role.terminating).toEqual(json.terminating);
        expect(role.paths).toBeUndefined();
        expect(role.pathHashPrefixes).toEqual(pathHashPrefixes);
        expect(role.unrecognizedFields).toEqual({ foo: 'bar' });
      });
    });
  });
});
