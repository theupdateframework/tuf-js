import { ValueError } from '../../error';
import { Delegations } from '../../models/delegations';
import { Key } from '../../models/key';
import { DelegatedRole } from '../../models/role';

describe('Delegations', () => {
  describe('constructor', () => {
    const keyOpts = {
      keyID: 'abc',
      keyType: 'ed25519',
      scheme: 'ed25519',
      keyVal: { public: 'abc' },
    };

    const opts = {
      keys: { key1: new Key(keyOpts) },
      unrecognizedFields: { foo: 'bar' },
    };

    describe('when called with roles', () => {
      const roleOpts = {
        name: 'foo',
        keyIDs: ['abc'],
        threshold: 1,
        terminating: true,
        paths: ['foo'],
      };

      const role = new DelegatedRole(roleOpts);
      describe('when role name is invalid', () => {
        it('constructs an object', () => {
          expect(() => {
            new Delegations({ ...opts, roles: { root: role } });
          }).toThrow(ValueError);
        });
      });

      describe('when role name is valid', () => {
        it('constructs an object', () => {
          const subject = new Delegations({ ...opts, roles: { foo: role } });

          expect(subject).toBeTruthy();
          expect(subject.keys).toEqual(opts.keys);
          expect(subject.roles).toEqual({ foo: role });
          expect(subject.unrecognizedFields).toEqual(opts.unrecognizedFields);
        });
      });
    });
  });

  describe('#equals', () => {
    const keyOpts = {
      keyID: 'abc',
      keyType: 'ed25519',
      scheme: 'ed25519',
      keyVal: { public: 'abc' },
    };
    const roleOpts = {
      name: 'root',
      keyIDs: ['abc'],
      threshold: 1,
      terminating: true,
      paths: ['foo'],
    };

    const opts = {
      keys: { abc: new Key(keyOpts) },
      roles: { foo: new DelegatedRole(roleOpts) },
      unrecognizedFields: { foo: 'bar' },
    };

    const delegations = new Delegations(opts);

    describe('when called with a non-Delegation object', () => {
      it('returns false', () => {
        expect(delegations.equals({} as Delegations)).toBeFalsy();
      });
    });

    describe('when called with a Delegations object with different keys', () => {
      const other = new Delegations({
        ...opts,
        keys: { def: new Key(keyOpts) },
      });
      it('returns false', () => {
        expect(delegations.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a Delegations object with different roles', () => {
      const other = new Delegations({ ...opts, roles: undefined });
      it('returns false', () => {
        expect(delegations.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a Delegations object with different unrecognizedFields', () => {
      const other = new Delegations({ ...opts, unrecognizedFields: {} });
      it('returns false', () => {
        expect(delegations.equals(other)).toBeFalsy();
      });
    });

    describe('when called with the same Delegations object', () => {
      it('returns true', () => {
        expect(delegations.equals(delegations)).toBeTruthy();
      });
    });

    describe('when called with the a matching Delegations object', () => {
      const other = new Delegations(opts);
      it('returns true', () => {
        expect(delegations.equals(other)).toBeTruthy();
      });
    });
  });

  describe('#rolesForTarget', () => {
    const fooRole = new DelegatedRole({
      name: 'foo',
      keyIDs: ['xyz'],
      threshold: 1,
      terminating: true,
      paths: ['b', 'c'],
    });

    const barRole = new DelegatedRole({
      name: 'bar',
      keyIDs: ['rst'],
      threshold: 1,
      terminating: false,
      paths: ['a', 'b'],
    });

    const opts = {
      keys: {},
      roles: { foo: fooRole, bar: barRole },
    };

    const delegations = new Delegations(opts);

    describe('when there is one matching role', () => {
      it('returns role that match the target', () => {
        const gen = delegations.rolesForTarget('a');

        let result = gen.next();
        expect(result.done).toEqual(false);
        expect(result.value).toEqual({ role: 'bar', terminating: false });

        result = gen.next();
        expect(result.done).toEqual(true);
      });
    });

    describe('when there are multiple matching roles', () => {
      it('returns role that match the target', () => {
        const gen = delegations.rolesForTarget('b');

        let result = gen.next();
        expect(result.done).toEqual(false);
        expect(result.value).toEqual({ role: 'foo', terminating: true });

        result = gen.next();
        expect(result.done).toEqual(false);
        expect(result.value).toEqual({ role: 'bar', terminating: false });

        result = gen.next();
        expect(result.done).toEqual(true);
      });
    });

    describe('when there are NOT matching role', () => {
      it('returns no roles', () => {
        const gen = delegations.rolesForTarget('d');

        const result = gen.next();
        expect(result.done).toEqual(true);
      });
    });
  });

  describe('#toJSON', () => {
    const keyOpts = {
      keyID: 'abc',
      keyType: 'ed25519',
      scheme: 'ed25519',
      keyVal: { public: 'abc' },
    };

    const opts = {
      keys: { abc: new Key(keyOpts) },
      unrecognizedFields: { foo: 'bar' },
    };

    describe('when there are roles', () => {
      const roleOpts = {
        name: 'foo',
        keyIDs: ['abc'],
        threshold: 1,
        terminating: true,
        paths: ['foo'],
      };

      const role = new DelegatedRole(roleOpts);
      const delegations = new Delegations({
        ...opts,
        roles: { foo: role },
      });

      it('returns the expected JSON', () => {
        expect(delegations.toJSON()).toEqual({
          keys: { abc: opts.keys['abc'].toJSON() },
          roles: [role.toJSON()],
          foo: 'bar',
        });
      });
    });

    describe('when there are NO roles', () => {
      const opts = {
        keys: { abc: new Key(keyOpts) },
        unrecognizedFields: { foo: 'bar' },
      };

      const delegations = new Delegations(opts);

      it('returns the expected JSON', () => {
        expect(delegations.toJSON()).toEqual({
          keys: { abc: opts.keys['abc'].toJSON() },
          foo: 'bar',
        });
      });
    });
  });

  describe('.fromJSON', () => {
    const json = {
      keys: {
        abc: {
          keyid_hash_algorithms: ['sha256', 'sha512'],
          keytype: 'ed25519',
          keyval: { public: 'abc' },
          scheme: 'ed25519',
        },
      },
      roles: [
        {
          keyids: ['abc'],
          name: 'foo',
          paths: ['foo'],
          threshold: 1,
          terminating: true,
        },
      ],
      foo: 'bar',
    };

    describe('when there is a type error with keys', () => {
      it('throws a TypeError', () => {
        expect(() =>
          Delegations.fromJSON({ ...json, keys: { abc: 2 } })
        ).toThrowError(TypeError);
      });
    });

    describe('when there is a type error with roles', () => {
      it('throws a TypeError', () => {
        expect(() =>
          Delegations.fromJSON({ ...json, roles: [2] })
        ).toThrowError(TypeError);
      });
    });

    describe('when the JSON is valid', () => {
      describe('when no roles are supplied', () => {
        it('returns the expected Delegations object', () => {
          const delegations = Delegations.fromJSON({
            keys: json.keys,
            foo: 'bar',
          });

          expect(delegations.keys).toBeTruthy();
          expect(delegations.keys).toHaveProperty('abc');

          const key = delegations.keys['abc'];
          expect(key).toBeInstanceOf(Key);

          expect(delegations.roles).toBeUndefined();
          expect(delegations.unrecognizedFields).toEqual({ foo: 'bar' });
        });
      });

      describe('when no roles are supplied', () => {
        it('returns the expected Delegations object', () => {
          const delegations = Delegations.fromJSON(json);

          expect(delegations.keys).toBeTruthy();
          expect(delegations.keys).toHaveProperty('abc');

          const key = delegations.keys['abc'];
          expect(key).toBeInstanceOf(Key);

          expect(delegations.roles).toBeTruthy();
          expect(delegations.roles).toHaveProperty('foo');

          const role = delegations.roles?.foo;
          expect(role).toBeInstanceOf(DelegatedRole);
          expect(role?.name).toEqual('foo');
          expect(role?.keyIDs).toEqual(['abc']);
          expect(role?.threshold).toEqual(1);
          expect(role?.terminating).toEqual(true);
          expect(role?.paths).toEqual(['foo']);

          expect(delegations.unrecognizedFields).toEqual({ foo: 'bar' });
        });
      });
    });
  });
});
