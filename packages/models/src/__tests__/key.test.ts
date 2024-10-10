import { Signed, SignedOptions } from '../base';
import { UnsignedMetadataError } from '../error';
import { Key } from '../key';
import { Signature } from '../signature';

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

  describe('#verifySignature', () => {
    // Hard-coded data -- the following signature is valid for the data and can be validated with the public key
    const data = { b: 'bar', a: 'foo' };
    const publicKey =
      '04167E0F6F4928F9F007CD7FA8DD3C6A4FBD97CC7CE1F9FE784E4DCD4AB039C20A88AC04E3FA629F0CEFDAD1D5ED7653E855D5A47B9663A185EE6DC60FF5DAE643';
    const sig =
      '30450220718be31aed3e59b9b422bed30d492d86f7e6c881098a6954cd06f2e07c098b67022100c1ddf76ffd3fea16098638079fde64dbd7f33b17350363bd8da9b49def6f7f50';
    const keyID = 'abc';

    const signature = new Signature({ keyID: keyID, sig: sig });

    class DummySigned extends Signed {
      toJSON() {
        return data;
      }
    }
    const metadata = {
      signed: new DummySigned({} as SignedOptions),
      signatures: { [keyID]: signature },
    };

    const key = new Key({
      keyID: keyID,
      keyType: 'ecdsa-sha2-nistp256',
      scheme: 'ecdsa-sha2-nistp256',
      keyVal: { public: publicKey },
    });

    describe('when no signature is found for the key', () => {
      it('throws an error', () => {
        expect(() => {
          key.verifySignature({ ...metadata, signatures: { xyz: signature } });
        }).toThrowError(UnsignedMetadataError);
      });
    });

    describe('when no signature does NOT match', () => {
      const badMetadata = {
        signed: new DummySigned({} as SignedOptions),
        signatures: { [keyID]: new Signature({ keyID: keyID, sig: 'bad' }) },
      };

      it('throws an error', () => {
        expect(() => {
          key.verifySignature(badMetadata);
        }).toThrowError(UnsignedMetadataError);
      });
    });

    describe('when key is missing', () => {
      const badKey = new Key({
        keyID: keyID,
        keyType: 'ecdsa-sha2-nistp256',
        scheme: 'ecdsa-sha2-nistp256',
        keyVal: { foo: 'bar' },
      });

      it('throws an error', () => {
        expect(() => {
          badKey.verifySignature(metadata);
        }).toThrowError(UnsignedMetadataError);
      });
    });

    describe('when key is malformed', () => {
      const badKey = new Key({
        keyID: keyID,
        keyType: 'ecdsa-sha2-nistp256',
        scheme: 'ecdsa-sha2-nistp256',
        keyVal: { public: 'bad' },
      });

      it('throws an error', () => {
        expect(() => {
          badKey.verifySignature(metadata);
        }).toThrowError();
      });
    });

    describe('when the signature is valid', () => {
      it('does NOT throw an error', () => {
        expect(() => {
          key.verifySignature(metadata);
        }).not.toThrow();
      });
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
