import { Signature } from './signature';

describe('Signature', () => {
  describe('constructor', () => {
    const opts = {
      keyID: 'abc',
      sig: 'def',
    };

    it('constructs a Signature', () => {
      const signature = new Signature(opts);
      expect(signature).toBeTruthy();
      expect(signature.keyID).toEqual(opts.keyID);
      expect(signature.sig).toEqual(opts.sig);
    });
  });

  describe('.fromJSON', () => {
    const json = {
      keyid: 'abc',
      sig: 'def',
    };

    describe('when there is a type error with keyid', () => {
      it('throws an error', () => {
        expect(() => {
          Signature.fromJSON({ ...json, keyid: 123 });
        }).toThrow(TypeError);
      });
    });

    describe('when there is a type error with sig', () => {
      it('throws an error', () => {
        expect(() => {
          Signature.fromJSON({ ...json, sig: 123 });
        }).toThrow(TypeError);
      });
    });

    describe('when the JSON is valid', () => {
      it('constructs a Signature from JSON', () => {
        const signature = Signature.fromJSON(json);
        expect(signature).toBeTruthy();
        expect(signature.keyID).toEqual(json.keyid);
        expect(signature.sig).toEqual(json.sig);
      });
    });
  });
});
