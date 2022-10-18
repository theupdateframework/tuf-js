import { getPublicKey } from './key';

describe('getPublicKey', () => {
  describe('when key is ed25519', () => {
    const type = 'ed25519';
    const scheme = 'ed25519';
    const bit =
      'edcd0a32a07dce33f7c7873aaffbff36d20ea30787574ead335eefd337e4dacd';

    it('encodes keys properly', () => {
      const pem = getPublicKey({ keyType: type, scheme, keyVal: bit });
      expect(pem.type).toEqual('public');
      expect(pem.asymmetricKeyType).toEqual('ed25519');

      // Only exists in Node 16+
      if (pem.asymmetricKeyDetails) {
        expect(pem.asymmetricKeyDetails).toEqual({});
      }
    });
  });

  describe('when key is ecdsa', () => {
    const type = 'ecdsa-sha2-nistp256';
    const scheme = 'ecdsa-sha2-nistp256';
    const bit =
      '04cbc5cab2684160323c25cd06c3307178a6b1d1c9b949328453ae473c5ba7527e35b13f298b41633382241f3fd8526c262d43b45adee5c618fa0642c82b8a9803';
    describe('fromHex', () => {
      it('encodes a public key', () => {
        const pem = getPublicKey({ keyType: type, scheme, keyVal: bit });
        expect(pem.type).toEqual('public');
        expect(pem.asymmetricKeyType).toEqual('ec');

        // Only exists in Node 16+
        if (pem.asymmetricKeyDetails) {
          expect(pem.asymmetricKeyDetails).toEqual({
            namedCurve: 'prime256v1',
          });
        }
      });
    });
  });
});
