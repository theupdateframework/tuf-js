import { ValueError } from '../../error';
import { SuccinctRoles } from '../../models/role';

describe('SuccinctRoles', () => {
  const opts = {
    keyIDs: [],
    threshold: 1,
    bitLength: 1,
    namePrefix: 'bin',
    unrecognizedFields: {},
  };
  describe('constructor', () => {
    describe('when bit length is not valid', () => {
      it('constructs an object', () => {
        expect(() => {
          new SuccinctRoles({ ...opts, bitLength: -1 });
        }).toThrow(ValueError);
      });
      it('constructs an object', () => {
        expect(() => {
          new SuccinctRoles({ ...opts, bitLength: 33 });
        }).toThrow(ValueError);
      });
    });
    describe('when bit length is valid', () => {
      it('constructs an object', () => {
        const subject = new SuccinctRoles({ ...opts, bitLength: 1 });
        expect(subject).toBeTruthy();
        expect(subject.bitLength).toEqual(1);
        expect(subject.namePrefix).toEqual(opts.namePrefix);
        expect(subject.unrecognizedFields).toEqual(opts.unrecognizedFields);
      });
      it('constructs an object', () => {
        const subject = new SuccinctRoles({ ...opts, bitLength: 32 });
        expect(subject).toBeTruthy();
        expect(subject.bitLength).toEqual(32);
        expect(subject.namePrefix).toEqual(opts.namePrefix);
        expect(subject.unrecognizedFields).toEqual(opts.unrecognizedFields);
      });
    });
  });

  describe('#isDelegatedRole', () => {
    const succinctRoles = new SuccinctRoles({
      ...opts,
      bitLength: 5,
    });

    const falseRoleNameExamples = [
      'foo',
      'bin-',
      'bin-s',
      'bin-0t',
      'bin-20',
      'bin-100',
    ];

    const trueNameExamples = ['bin-00', 'bin-0f', 'bin-1f'];

    describe('when called with WRONG role names', () => {
      it('returns false', () => {
        falseRoleNameExamples.forEach((roleName) => {
          expect(succinctRoles.isDelegatedRole(roleName)).toBeFalsy();
        });
      });
    });
    describe('when called with CORRECT role names', () => {
      it('returns false', () => {
        trueNameExamples.forEach((roleName) => {
          expect(succinctRoles.isDelegatedRole(roleName)).toBeTruthy();
        });
      });
    });
  });

  describe('#getRoleForTarget', () => {
    const succinctRoles = new SuccinctRoles({ ...opts, bitLength: 8 });
    const targetNameExamples = [
      'target-0',
      'target-1',
      'target-2',
      'target-3',
      'target-4',
      'target-5',
    ];
    const targetBinCorrectExamples = [
      'bin-8b',
      'bin-75',
      'bin-b5',
      'bin-a3',
      'bin-8c',
      'bin-14',
    ];
    const targetBinWrongExamples = [
      'bin-00',
      'bin-00',
      'bin-00',
      'bin-00',
      'bin-00',
      'bin-00',
    ];

    describe('when checked with CORRECT target bin examples', () => {
      it('returns true', () => {
        targetNameExamples.forEach((targetName, index) => {
          expect(succinctRoles.getRoleForTarget(targetName)).toBe(
            targetBinCorrectExamples[index]
          );
        });
      });
    });
    describe('when checked with WRONG target bin examples', () => {
      it('returns false', () => {
        targetNameExamples.forEach((targetName, index) => {
          expect(succinctRoles.getRoleForTarget(targetName)).not.toBe(
            targetBinWrongExamples[index]
          );
        });
      });
    });
  });

  describe('#equals', () => {
    const succinctRoles = new SuccinctRoles(opts);

    describe('when called with a non-SuccinctRoles object', () => {
      it('returns false', () => {
        expect(succinctRoles.equals({} as SuccinctRoles)).toBeFalsy();
      });
    });

    describe('when called with a SuccinctRoles object with different KeyIds', () => {
      const other = new SuccinctRoles({
        ...opts,
        keyIDs: ['keyid1'],
      });
      it('returns false', () => {
        expect(succinctRoles.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a SuccinctRoles object with different threshold', () => {
      const other = new SuccinctRoles({ ...opts, threshold: 2 });
      it('returns false', () => {
        expect(succinctRoles.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a SuccinctRoles object with different bit length', () => {
      const other = new SuccinctRoles({ ...opts, bitLength: 2 });
      it('returns false', () => {
        expect(succinctRoles.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a SuccinctRoles object with different prefix name', () => {
      const other = new SuccinctRoles({ ...opts, namePrefix: '' });
      it('returns false', () => {
        expect(succinctRoles.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a SuccinctRoles object with different unrecognizedFields', () => {
      const other = new SuccinctRoles({
        ...opts,
        unrecognizedFields: { others: true },
      });
      it('returns false', () => {
        expect(succinctRoles.equals(other)).toBeFalsy();
      });
    });

    describe('when called with the same SuccinctRoles object', () => {
      it('returns true', () => {
        expect(succinctRoles.equals(succinctRoles)).toBeTruthy();
      });
    });

    describe('when called with the a matching succinctRoles object', () => {
      const other = new SuccinctRoles(opts);
      it('returns true', () => {
        expect(succinctRoles.equals(other)).toBeTruthy();
      });
    });
  });

  describe('#getRoles', () => {
    describe('when bit length is 1', () => {
      it('returns 2 bins', () => {
        const succinctRoles = new SuccinctRoles(opts);

        const gen = succinctRoles.getRoles();

        let result = gen.next();
        expect(result.done).toEqual(false);
        expect(result.value).toEqual('bin-0');

        result = gen.next();
        expect(result.done).toEqual(false);
        expect(result.value).toEqual('bin-1');

        result = gen.next();
        expect(result.done).toEqual(true);
      });
    });

    describe('when bit length is 4', () => {
      it('returns 16 bins', () => {
        const succinctRoles = new SuccinctRoles({ ...opts, bitLength: 4 });

        const gen = succinctRoles.getRoles();

        let result = gen.next();
        expect(result.done).toEqual(false);
        expect(result.value).toEqual('bin-0');

        for (let i = 0; i < 14; i++) {
          result = gen.next();
          expect(result.done).toEqual(false);
        }

        result = gen.next();
        expect(result.done).toEqual(false);
        expect(result.value).toEqual('bin-f');

        result = gen.next();
        expect(result.done).toEqual(true);
      });
    });
  });

  describe('#toJSON', () => {
    describe('when bit length is 1', () => {
      const succinctRoles = new SuccinctRoles(opts);

      it('returns the expected JSON', () => {
        expect(succinctRoles.toJSON()).toEqual({
          bitLength: opts.bitLength,
          namePrefix: opts.namePrefix,
          numberOfBins: 2,
          suffixLen: 1,
          keyids: opts.keyIDs,
          threshold: opts.threshold,
          ...opts.unrecognizedFields,
        });
      });
    });
    describe('when bit length is 32', () => {
      const succinctRoles = new SuccinctRoles({ ...opts, bitLength: 32 });

      it('returns the expected JSON', () => {
        expect(succinctRoles.toJSON()).toEqual({
          bitLength: 32,
          namePrefix: opts.namePrefix,
          numberOfBins: 4294967296,
          suffixLen: 8,
          keyids: opts.keyIDs,
          threshold: opts.threshold,
          ...opts.unrecognizedFields,
        });
      });
    });
  });

  describe('.fromJSON', () => {
    const json = {
      keyids: [
        'ddfd898acbb813a32d90cdba91c992c027ad83464162856b8e7b1d98b801a294',
      ],
      bit_length: 1,
      name_prefix: 'bin',
      threshold: 1,
      foo: 'bar',
    };

    describe('when there is a type error with keyids', () => {
      it('throws a TypeError', () => {
        expect(() =>
          SuccinctRoles.fromJSON({ ...json, keyids: { abc: 2 } })
        ).toThrowError(TypeError);
      });
    });

    describe('when there is a type error with bit length', () => {
      it('throws a TypeError', () => {
        expect(() =>
          SuccinctRoles.fromJSON({ ...json, bit_length: '1' })
        ).toThrowError(TypeError);
      });
    });

    describe('when there is a type error with name prefix', () => {
      it('throws a TypeError', () => {
        expect(() =>
          SuccinctRoles.fromJSON({ ...json, name_prefix: 1 })
        ).toThrowError(TypeError);
      });
    });

    describe('when there is a type error with name threshold', () => {
      it('throws a TypeError', () => {
        expect(() =>
          SuccinctRoles.fromJSON({ ...json, threshold: '1' })
        ).toThrowError(TypeError);
      });
    });

    describe('when the JSON is valid', () => {
      it('returns the expected SuccinctRoles object', () => {
        const succinctRoles = SuccinctRoles.fromJSON(json);

        expect(succinctRoles.keyIDs).toBeTruthy();
        expect(succinctRoles.keyIDs).toStrictEqual([
          'ddfd898acbb813a32d90cdba91c992c027ad83464162856b8e7b1d98b801a294',
        ]);

        expect(succinctRoles.threshold).toBeTruthy();
        expect(succinctRoles.threshold).toEqual(1);

        expect(succinctRoles.bitLength).toBeTruthy();
        expect(succinctRoles.bitLength).toBe(1);

        expect(succinctRoles.namePrefix).toBeTruthy();
        expect(succinctRoles.namePrefix).toBe('bin');

        expect(succinctRoles.numberOfBins).toBeTruthy();
        expect(succinctRoles.numberOfBins).toBe(2);

        expect(succinctRoles.suffixLen).toBeTruthy();
        expect(succinctRoles.suffixLen).toBe(1);

        expect(succinctRoles.unrecognizedFields).toEqual({ foo: 'bar' });
      });
    });
  });
});
