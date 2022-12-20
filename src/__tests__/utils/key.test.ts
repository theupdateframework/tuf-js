import { CryptoError, UnsupportedAlgorithmError } from '../../error';
import { getPublicKey } from '../../utils/key';

describe('getPublicKey', () => {
  describe('when key is rsa', () => {
    const type = 'rsa';
    const scheme = 'rsassa-pss-sha256';
    const bit =
      '-----BEGIN PUBLIC KEY-----\nMIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEA0GjPoVrjS9eCqzoQ8VRe\nPkC0cI6ktiEgqPfHESFzyxyjC490Cuy19nuxPcJuZfN64MC48oOkR+W2mq4pM51i\nxmdG5xjvNOBRkJ5wUCc8fDCltMUTBlqt9y5eLsf/4/EoBU+zC4SW1iPU++mCsity\nfQQ7U6LOn3EYCyrkH51hZ/dvKC4o9TPYMVxNecJ3CL1q02Q145JlyjBTuM3Xdqsa\nndTHoXSRPmmzgB/1dL/c4QjMnCowrKW06mFLq9RAYGIaJWfM/0CbrOJpVDkATmEc\nMdpGJYDfW/sRQvRdlHNPo24ZW7vkQUCqdRxvnTWkK5U81y7RtjLt1yskbWXBIbOV\nz94GXsgyzANyCT9qRjHXDDz2mkLq+9I2iKtEqaEePcWRu3H6RLahpM/TxFzw684Y\nR47weXdDecPNxWyiWiyMGStRFP4Cg9trcwAGnEm1w8R2ggmWphznCd5dXGhPNjfA\na82yNFY8ubnOUVJOf0nXGg3Edw9iY3xyjJb2+nrsk5f3AgMBAAE=\n-----END PUBLIC KEY-----';
    const invaliBit =
      '-----BEGIN WRONG KEY-----\nMIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEA0GjPoVrjS9eCqzoQ8VRe\nPkC0cI6ktiEgqPfHESFzyxyjC490Cuy19nuxPcJuZfN64MC48oOkR+W2mq4pM51i\nxmdG5xjvNOBRkJ5wUCc8fDCltMUTBlqt9y5eLsf/4/EoBU+zC4SW1iPU++mCsity\nfQQ7U6LOn3EYCyrkH51hZ/dvKC4o9TPYMVxNecJ3CL1q02Q145JlyjBTuM3Xdqsa\nndTHoXSRPmmzgB/1dL/c4QjMnCowrKW06mFLq9RAYGIaJWfM/0CbrOJpVDkATmEc\nMdpGJYDfW/sRQvRdlHNPo24ZW7vkQUCqdRxvnTWkK5U81y7RtjLt1yskbWXBIbOV\nz94GXsgyzANyCT9qRjHXDDz2mkLq+9I2iKtEqaEePcWRu3H6RLahpM/TxFzw684Y\nR47weXdDecPNxWyiWiyMGStRFP4Cg9trcwAGnEm1w8R2ggmWphznCd5dXGhPNjfA\na82yNFY8ubnOUVJOf0nXGg3Edw9iY3xyjJb2+nrsk5f3AgMBAAE=\n-----END PUBLIC KEY-----';

    describe('fromHex with PEM header', () => {
      it('encodes a public key', () => {
        const publicKey = getPublicKey({ keyType: type, scheme, keyVal: bit });
        expect(publicKey.key.type).toEqual('public');
        expect(publicKey.key.asymmetricKeyType).toEqual('rsa');
      });
    });
    describe('fromHex without PEM header', () => {
      it('throws an error', () => {
        expect(() => {
          getPublicKey({ keyType: type, scheme, keyVal: invaliBit });
        }).toThrow(CryptoError);
      });
    });
    describe('when unsupported key', () => {
      describe('Unsupported Algorithm', () => {
        it('throws an error', () => {
          expect(() => {
            getPublicKey({
              keyType: type,
              scheme: 'unspporteed',
              keyVal: bit,
            });
          }).toThrow(UnsupportedAlgorithmError);
        });
      });
    });
  });

  describe('when key is ed25519', () => {
    const type = 'ed25519';
    const scheme = 'ed25519';
    const bit =
      'edcd0a32a07dce33f7c7873aaffbff36d20ea30787574ead335eefd337e4dacd';
    const invalidBit =
      '!dcd0a32a07dce33f7c7873aaffbff36d20ea30787574ead335eefd337e4dacd';

    const bitWithPEM =
      '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA/DIbglGpx4BhW+yFV3q8A7xgmrIS0QtPU1ABUMps+UM=\n-----END PUBLIC KEY-----';

    describe('fromHex with PEM header', () => {
      it('encodes keys properly', () => {
        const publicKey = getPublicKey({
          keyType: type,
          scheme,
          keyVal: bitWithPEM,
        });

        expect(publicKey.key.type).toEqual('public');
        expect(publicKey.key.asymmetricKeyType).toEqual('ed25519');

        // Only exists in Node 16+
        if (publicKey.key.asymmetricKeyDetails) {
          expect(publicKey.key.asymmetricKeyDetails).toEqual({});
        }
      });
    });
    describe('fromHex without PEM header', () => {
      it('encodes keys properly', () => {
        const publicKey = getPublicKey({ keyType: type, scheme, keyVal: bit });

        expect(publicKey.key.type).toEqual('public');
        expect(publicKey.key.asymmetricKeyType).toEqual('ed25519');

        // Only exists in Node 16+
        if (publicKey.key.asymmetricKeyDetails) {
          expect(publicKey.key.asymmetricKeyDetails).toEqual({});
        }
      });
      it('invalidBit throws an error', () => {
        expect(() => {
          getPublicKey({ keyType: type, scheme, keyVal: invalidBit });
        }).toThrow(CryptoError);
      });
    });
  });

  describe('when key is ecdsa', () => {
    const type = 'ecdsa-sha2-nistp256';
    const types = ['ecdsa', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384'];

    const scheme = 'ecdsa-sha2-nistp256';
    const bit =
      '04cbc5cab2684160323c25cd06c3307178a6b1d1c9b949328453ae473c5ba7527e35b13f298b41633382241f3fd8526c262d43b45adee5c618fa0642c82b8a9803';
    const invalidBit =
      '!4cbc5cab2684160323c25cd06c3307178a6b1d1c9b949328453ae473c5ba7527e35b13f298b41633382241f3fd8526c262d43b45adee5c618fa0642c82b8a9803';
    const bitWithPEM =
      '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE/R05vF6ovVnp0FU0IKfSXNG437P4\nCPCYd35L6P8gshRhhR4JeBRTUyfoso4S1u08AgS9XctKitUepHV/SaHPpg==\n-----END PUBLIC KEY-----';

    describe('various key types', () => {
      it('correct key type', () => {
        types.forEach((type) => {
          const publicKey = getPublicKey({
            keyType: type,
            scheme,
            keyVal: bit,
          });
          expect(publicKey.key.type).toEqual('public');
          expect(publicKey.key.asymmetricKeyType).toEqual('ec');

          // Only exists in Node 16+
          if (publicKey.key.asymmetricKeyDetails) {
            expect(publicKey.key.asymmetricKeyDetails).toEqual({
              namedCurve: 'prime256v1',
            });
          }
        });
      });
    });

    describe('fromHex with PEM header', () => {
      it('encodes keys properly', () => {
        const publicKey = getPublicKey({
          keyType: type,
          scheme,
          keyVal: bitWithPEM,
        });
        expect(publicKey.key.type).toEqual('public');
        expect(publicKey.key.asymmetricKeyType).toEqual('ec');

        // Only exists in Node 16+
        if (publicKey.key.asymmetricKeyDetails) {
          expect(publicKey.key.asymmetricKeyDetails).toEqual({
            namedCurve: 'prime256v1',
          });
        }
      });
    });
    describe('fromHex without PEM header', () => {
      it('encodes keys properly', () => {
        const publicKey = getPublicKey({ keyType: type, scheme, keyVal: bit });
        expect(publicKey.key.type).toEqual('public');
        expect(publicKey.key.asymmetricKeyType).toEqual('ec');

        // Only exists in Node 16+
        if (publicKey.key.asymmetricKeyDetails) {
          expect(publicKey.key.asymmetricKeyDetails).toEqual({
            namedCurve: 'prime256v1',
          });
        }
      });
      it('invalidBit throws an error', () => {
        expect(() => {
          getPublicKey({ keyType: type, scheme, keyVal: invalidBit });
        }).toThrow(CryptoError);
      });
    });
  });

  describe('when unsupported key', () => {
    describe('Unsupported Algorithm', () => {
      it('throws an error', () => {
        expect(() => {
          getPublicKey({ keyType: 'unspported', scheme: '', keyVal: '' });
        }).toThrow(UnsupportedAlgorithmError);
      });
    });
  });
});
