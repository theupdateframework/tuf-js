import { Key } from './key';

describe('Key', () => {
  describe('constructor', () => {
    const opts = {
      keyID: 'abc',
      keyType: 'ed25519',
      scheme: 'ed25519',
      keyVal: { public: 'abc' },
      unrecognizedFields: { foo: 'bar' },
    };

    it('creates a new Key', () => {
      const key = new Key(opts);

      expect(key).toBeTruthy();
      expect(key.keyID).toEqual(opts.keyID);
      expect(key.keyType).toEqual(opts.keyType);
      expect(key.scheme).toEqual(opts.scheme);
      expect(key.keyVal).toEqual(opts.keyVal);
      expect(key.unrecognizedFields).toEqual(opts.unrecognizedFields);
    });
  });

  describe('#equals', () => {
    const opts = {
      keyID: 'abc',
      keyType: 'ed25519',
      scheme: 'ed25519',
      keyVal: { public: 'abc' },
      unrecognizedFields: { foo: 'bar' },
    };
    const key = new Key(opts);

    describe('when called with a non-Key object', () => {
      it('returns false', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(key.equals({} as any)).toBeFalsy();
      });
    });

    describe('when called with a Key object with different keyID', () => {
      const other = new Key({ ...opts, keyID: 'def' });
      it('returns false', () => {
        expect(key.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a Key object with different keyType', () => {
      const other = new Key({ ...opts, keyType: 'rsa' });
      it('returns false', () => {
        expect(key.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a Key object with different scheme', () => {
      const other = new Key({ ...opts, scheme: 'rsa' });
      it('returns false', () => {
        expect(key.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a Key object with different keyVal', () => {
      const other = new Key({ ...opts, keyVal: { public: 'def' } });
      it('returns false', () => {
        expect(key.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a Key object with different unrecognizedFields', () => {
      const other = new Key({ ...opts, unrecognizedFields: {} });
      it('returns false', () => {
        expect(key.equals(other)).toBeFalsy();
      });
    });

    describe('when called with a Key object with the same values', () => {
      const other = new Key(opts);
      it('returns true', () => {
        expect(key.equals(other)).toBeTruthy();
      });
    });

    describe('when called with the same Key object', () => {
      it('returns true', () => {
        expect(key.equals(key)).toBeTruthy();
      });
    });
  });

  describe('#toJSON', () => {
    const opts = {
      keyID: 'abc',
      keyType: 'ed25519',
      scheme: 'ed25519',
      keyVal: { public: 'abc' },
      unrecognizedFields: { foo: 'bar' },
    };
    const key = new Key(opts);

    it('returns the expected JSON', () => {
      expect(key.toJSON()).toEqual({
        keytype: opts.keyType,
        scheme: opts.scheme,
        keyval: opts.keyVal,
        foo: opts.unrecognizedFields.foo,
      });
    });
  });

  describe('.fromJSON', () => {
    const json = {
      keyid: 'abc',
      keytype: 'ed25519',
      scheme: 'ed25519',
      keyval: { public: 'abc' },
      foo: 'bar',
    };

    describe('when there is a type error with keytype', () => {
      it('throws an error', () => {
        expect(() =>
          Key.fromJSON('abc', { ...json, keytype: 123 })
        ).toThrowError(TypeError);
      });
    });

    describe('when there is a type error with scheme', () => {
      it('throws an error', () => {
        expect(() => Key.fromJSON('abc', { ...json, scheme: 1 })).toThrowError(
          TypeError
        );
      });
    });

    describe('when there is a type error with keyval', () => {
      it('throws an error', () => {
        expect(() => Key.fromJSON('abc', { ...json, keyval: 1 })).toThrowError(
          TypeError
        );
      });
    });

    describe('when the JSON is valid', () => {
      it('returns the expected Key', () => {
        const key = Key.fromJSON('abc', json);

        expect(key).toBeTruthy();
        expect(key.keyID).toEqual(json.keyid);
        expect(key.keyType).toEqual(json.keytype);
        expect(key.scheme).toEqual(json.scheme);
        expect(key.keyVal).toEqual(json.keyval);
      });
    });
  });
});
