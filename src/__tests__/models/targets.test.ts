import { Delegations } from '../../models/delegations';
import { TargetFile } from '../../models/file';
import { Targets } from '../../models/targets';

describe('Targets', () => {
  describe('constructor', () => {
    const targetFile = new TargetFile({
      path: 'a',
      length: 1,
      hashes: { sha256: 'abc' },
    });

    const delegations = new Delegations({
      keys: {},
      roles: {},
    });

    const opts = {
      specVersion: '1.0.0',
      version: 1,
      expires: '1970-01-01T00:00:01.000Z',
      targets: { a: targetFile },
      delegations: delegations,
      unrecognizedFields: { foo: 'bar' },
    };

    describe('when delegations is undefined', () => {
      it('should create a new Targets object', () => {
        const targets = new Targets({ ...opts, delegations: undefined });

        expect(targets).toBeTruthy();
        expect(targets.delegations).toBeUndefined();
      });
    });

    describe('when targets is undefined', () => {
      it('should create a new Targets object', () => {
        const targets = new Targets({ ...opts, targets: undefined });

        expect(targets).toBeTruthy();
        expect(targets.targets).toEqual({});
      });
    });

    describe('when all options are specified', () => {
      it('should create a new Targets object', () => {
        const targets = new Targets(opts);

        expect(targets).toBeTruthy();
        expect(targets.specVersion).toEqual(opts.specVersion);
        expect(targets.version).toEqual(opts.version);
        expect(targets.expires).toEqual(opts.expires);
        expect(targets.delegations).toEqual(opts.delegations);
        expect(targets.targets).toEqual(opts.targets);
        expect(targets.unrecognizedFields).toEqual(opts.unrecognizedFields);
      });
    });
  });

  describe('#addTarget', () => {
    const targetFile = new TargetFile({
      path: 'a',
      length: 1,
      hashes: { sha256: 'abc' },
    });

    const targets = new Targets({});

    it('adds a target', () => {
      targets.addTarget(targetFile);
      expect(targets.targets).toHaveProperty(targetFile.path);
      expect(targets.targets[targetFile.path]).toEqual(targetFile);
    });
  });

  describe('#equals', () => {
    const targetFile = new TargetFile({
      path: 'a',
      length: 1,
      hashes: { sha256: 'abc' },
    });

    const delegations = new Delegations({
      keys: {},
      roles: {},
    });

    const opts = {
      specVersion: '1.0.0',
      version: 1,
      expires: '1970-01-01T00:00:01.000Z',
      targets: { a: targetFile },
      delegations: delegations,
      unrecognizedFields: { foo: 'bar' },
    };

    const targets = new Targets(opts);
    describe('when called with a non-Targets object', () => {
      it('returns false', () => {
        expect(targets.equals({} as Targets)).toBeFalsy();
      });
    });

    describe('when called with a Targets object with different specVersion', () => {
      const other = new Targets({ ...opts, specVersion: '1.0.1' });
      it('returns false', () => {
        expect(targets.equals(other)).toBeFalsy();
      });
    });

    describe('when called wtih a Targets object with different targets', () => {
      const other = new Targets({ ...opts, targets: { b: targetFile } });
      it('returns false', () => {
        expect(targets.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a Targets object with different delegations', () => {
      const other = new Targets({ ...opts, delegations: undefined });
      it('returns false', () => {
        expect(targets.equals(other)).toBeFalsy();
      });
    });

    describe('when called with the same Targets object', () => {
      it('returns true', () => {
        expect(targets.equals(targets)).toBeTruthy();
      });
    });

    describe('when called with the a matching Targets object', () => {
      const other = new Targets(opts);
      it('returns true', () => {
        expect(targets.equals(other)).toBeTruthy();
      });
    });
  });

  describe('#toJSON', () => {
    const targetFile = new TargetFile({
      path: 'a',
      length: 1,
      hashes: { sha256: 'abc' },
    });

    const delegations = new Delegations({
      keys: {},
      roles: {},
    });

    describe('when there are no delegations', () => {
      const opts = {
        specVersion: '1.0.0',
        version: 1,
        expires: '1970-01-01T00:00:01.000Z',
        targets: { a: targetFile },
        unrecognizedFields: { foo: 'bar' },
      };

      const targets = new Targets(opts);

      it('should return a JSON representation', () => {
        expect(targets.toJSON()).toEqual({
          _type: 'targets',
          spec_version: opts.specVersion,
          version: opts.version,
          expires: opts.expires,
          targets: { a: targetFile.toJSON() },
          foo: 'bar',
        });
      });
    });

    describe('when there are delegations', () => {
      const opts = {
        specVersion: '1.0.0',
        version: 1,
        expires: '1970-01-01T00:00:01.000Z',
        targets: { a: targetFile },
        delegations: delegations,
        unrecognizedFields: { foo: 'bar' },
      };

      const targets = new Targets(opts);

      it('should return a JSON representation', () => {
        expect(targets.toJSON()).toEqual({
          _type: 'targets',
          spec_version: opts.specVersion,
          version: opts.version,
          expires: opts.expires,
          targets: { a: targetFile.toJSON() },
          delegations: delegations.toJSON(),
          foo: 'bar',
        });
      });
    });
  });

  describe('.fromJSON', () => {
    const json = {
      spec_version: '1.0.0',
      version: 1,
      expires: '1970-01-01T00:00:01.000Z',
      targets: { a: { length: 1, hashes: { sha256: 'abc' } } },
      delegations: {
        keys: {},
        roles: [
          {
            name: 'a',
            keyids: ['a'],
            threshold: 1,
            paths: ['a'],
            terminating: false,
          },
        ],
      },
      foo: 'bar',
    };

    describe('when there is a type error with targets', () => {
      it('should throw a TypeError', () => {
        expect(() => Targets.fromJSON({ ...json, targets: 'a' })).toThrow(
          TypeError
        );
      });
    });

    describe('when there is a type error with delegations', () => {
      it('should throw a TypeError', () => {
        expect(() => Targets.fromJSON({ ...json, delegations: 'a' })).toThrow(
          TypeError
        );
      });
    });

    describe('when JSON is valid', () => {
      it('returns a Targets object', () => {
        const targets = Targets.fromJSON(json);

        expect(targets.specVersion).toEqual(json.spec_version);
        expect(targets.version).toEqual(json.version);
        expect(targets.expires).toEqual(json.expires);
        expect(targets.targets).toHaveProperty('a');

        const targetFile = targets.targets.a;
        expect(targetFile.length).toEqual(json.targets.a.length);
        expect(targetFile.hashes).toEqual(json.targets.a.hashes);

        expect(targets.delegations).toBeDefined();
        expect(targets.delegations?.keys).toEqual(json.delegations.keys);
        expect(targets.delegations?.roles).toBeDefined();
      });
    });
  });
});
