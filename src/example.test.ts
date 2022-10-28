import crypto from 'crypto';
import * as fs from 'fs';
import { canonicalize } from './utils/json';
import { getPublicKey } from './utils/key';

describe('sigstore TUF', () => {
  const root = JSON.parse(
    fs.readFileSync('./examples/sigstore/root.json').toString()
  );

  describe('root verification', () => {
    it('should verify', () => {
      const signature = root.signatures[0];
      const sig = signature.sig;

      const key = root.signed.keys[signature.keyid].keyval.public;
      const publicKey = getPublicKey({
        keyType: 'ecdsa',
        scheme: 'ecdsa',
        keyVal: key,
      });

      const canonicalData = canonicalize(root.signed) || '';

      const result = crypto.verify(
        undefined,
        canonicalData,
        publicKey,
        Buffer.from(sig, 'hex')
      );

      expect(result).toBe(true);
    });
  });
});

describe('python TUF sample', () => {
  describe('verify timestamp meta from root ', () => {
    const root = JSON.parse(fs.readFileSync('./examples/root.json').toString());
    const timestamp = JSON.parse(
      fs.readFileSync('./examples/timestamp.json').toString()
    );

    describe('when the signature is valid', () => {
      it('should verify', () => {
        const signature = timestamp.signatures[0];
        const sig = signature.sig;

        const key = root.signed.keys[signature.keyid].keyval.public;
        const publicKey = getPublicKey({
          keyType: 'ed25519',
          scheme: 'ed25519',
          keyVal: key,
        });

        const canonicalData = canonicalize(timestamp.signed) || '';

        const result = crypto.verify(
          undefined,
          canonicalData,
          publicKey,
          Buffer.from(sig, 'hex')
        );
        expect(result).toBe(true);
      });
    });

    describe('when the signature is invalid', () => {
      it('should NOT verify', () => {
        const signature = timestamp.signatures[0];
        const sig = signature.sig;

        const key = root.signed.keys[signature.keyid].keyval.public;
        const publicKey = getPublicKey({
          keyType: 'ed25519',
          scheme: 'ed25519',
          keyVal: key,
        });

        const canonicalData =
          canonicalize({ ...timestamp.signed, foo: 'bar' }) || '';

        const result = crypto.verify(
          undefined,
          canonicalData,
          publicKey,
          Buffer.from(sig, 'hex')
        );
        expect(result).toBe(false);
      });
    });

    describe('verifying root w/ RSA key', () => {
      it('should verify', () => {
        const signature = root.signatures[0];
        const sig = signature.sig;

        const key = root.signed.keys[signature.keyid].keyval.public;

        const canonicalData = canonicalize(root.signed) || '';

        const result = crypto.verify(
          undefined,
          canonicalData,
          {
            key: key,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          },
          Buffer.from(sig, 'hex')
        );
        expect(result).toBe(true);
      });
    });
  });
});
