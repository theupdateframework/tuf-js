import { Targets } from './targets';
import { TargetFile } from './file';
import { Delegations } from './delegations';

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(targets.equals({} as any)).toBeFalsy();
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
});
