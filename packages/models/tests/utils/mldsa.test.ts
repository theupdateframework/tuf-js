import { canonicalize } from '@tufjs/canonical-json';
import crypto from 'crypto';
import { CryptoError, UnsupportedAlgorithmError } from '../../src/error';
import { getPublicKey } from '../../src/utils/key';
import { verifySignature } from '../../src/utils/verify';

const [major, minor] = process.versions.node.split('.').map(Number);
const supportsMLDSA = major > 24 || (major === 24 && minor >= 6);
const describeMLDSA = supportsMLDSA ? describe : describe.skip;

describe('ML-DSA verification', () => {
  const signed = { b: 'value', a: 42 };
  const canonical = Buffer.from(canonicalize(signed));
  const framed = Buffer.concat([
    Buffer.from([0x74, 0x75, 0x66, 0x01]),
    crypto.createHash('sha512').update(canonical).digest(),
  ]);

  it('rejects unknown schemes and protocol versions', () => {
    for (const scheme of ['ml-dsa-44/2', 'ml-dsa-44/01', 'ml-dsa-99/1']) {
      expect(() =>
        getPublicKey({ keyType: 'ml-dsa', scheme, keyVal: '' })
      ).toThrow(UnsupportedAlgorithmError);
    }
  });

  it('reports ML-DSA as unsupported on Node.js 22', () => {
    const nodeVersion = Object.getOwnPropertyDescriptor(
      process.versions,
      'node'
    );
    try {
      Object.defineProperty(process.versions, 'node', { value: '22.22.2' });
      expect(() =>
        getPublicKey({
          keyType: 'ml-dsa',
          scheme: 'ml-dsa-44/1',
          keyVal: '-----BEGIN PUBLIC KEY-----',
        })
      ).toThrow('ML-DSA is not supported by this Node.js version');
    } finally {
      if (nodeVersion)
        Object.defineProperty(process.versions, 'node', nodeVersion);
    }
  });

  describeMLDSA('with native ML-DSA', () => {
    it.each(['ml-dsa-44', 'ml-dsa-65', 'ml-dsa-87'] as const)(
      'verifies %s and rejects changed metadata and incorrect framing',
      (algorithm) => {
        const { publicKey, privateKey } = crypto.generateKeyPairSync(algorithm);
        const key = getPublicKey({
          keyType: 'ml-dsa',
          scheme: `${algorithm}/1`,
          keyVal: publicKey.export({ type: 'spki', format: 'pem' }),
        });
        const sign = (message: Buffer) =>
          crypto.sign(null, message, privateKey).toString('hex');

        expect(verifySignature(signed, key, sign(framed))).toBe(true);
        expect(verifySignature({ ...signed, a: 43 }, key, sign(framed))).toBe(
          false
        );
        expect(verifySignature(signed, key, sign(canonical))).toBe(false);
        expect(
          verifySignature(
            signed,
            key,
            sign(Buffer.concat([Buffer.from('tuf\x02'), framed.subarray(4)]))
          )
        ).toBe(false);
      }
    );

    it('rejects a public key whose parameter set does not match the scheme', () => {
      const { publicKey } = crypto.generateKeyPairSync('ml-dsa-65');
      expect(() =>
        getPublicKey({
          keyType: 'ml-dsa',
          scheme: 'ml-dsa-44/1',
          keyVal: publicKey.export({ type: 'spki', format: 'pem' }),
        })
      ).toThrow('ML-DSA key parameter set does not match scheme');
    });

    it('rejects keys that are not PEM-encoded', () => {
      expect(() =>
        getPublicKey({
          keyType: 'ml-dsa',
          scheme: 'ml-dsa-44/1',
          keyVal: 'abcd',
        })
      ).toThrow(CryptoError);
    });
  });
});
