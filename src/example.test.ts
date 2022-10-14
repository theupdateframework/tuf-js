import canonicalize from 'canonicalize';
import crypto from 'crypto';
import * as fs from 'fs';
import { ecdsa, ed25519 } from './tuf-client/utils/key';

describe('sigstore TUF', () => {
  const root = JSON.parse(
    fs.readFileSync('./examples/sigstore/root.json').toString()
  );

  describe('root verification', () => {
    it('should verify', () => {
      const signature = root.signatures[0];
      const sig = signature.sig;

      const key = root.signed.keys[signature.keyid].keyval.public;
      const publicKey = ecdsa.fromHex(key);

      const canonicalData = canonicalize(root.signed) || '';

      const result = crypto.verify(
        undefined,
        Buffer.from(canonicalData, 'utf8'),
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
        const publicKey = ed25519.fromHex(key);

        const canonicalData = canonicalize(timestamp.signed) || '';

        const result = crypto.verify(
          undefined,
          Buffer.from(canonicalData, 'utf8'),
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
        const publicKey = ed25519.fromHex(key);

        const canonicalData =
          canonicalize({ ...timestamp.signed, foo: 'bar' }) || '';

        const result = crypto.verify(
          undefined,
          Buffer.from(canonicalData),
          publicKey,
          Buffer.from(sig, 'hex')
        );
        expect(result).toBe(false);
      });
    });

    describe('verifying root w/ RSA key', () => {
      xit('should verify', () => {
        const signature = root.signatures[0];
        const sig = signature.sig;

        const key = root.signed.keys[signature.keyid].keyval.public;
        const publicKey = crypto.createPublicKey(key);

        const canonicalData = canonicalize(root.signed) || '';

        const result = crypto.verify(
          'SHA256',
          Buffer.from(canonicalData, 'utf8'),
          // {
          //   key: key,
          //   format: 'pem',
          //   padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          //   saltLength: crypto.constants.RSA_PSS_SALTLEN_AUTO,
          // },
          publicKey,
          Buffer.from(sig, 'hex')
        );
        expect(result).toBe(true);
      });
    });
  });
});
