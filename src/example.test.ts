import canonicalize from 'canonicalize';
import crypto from 'crypto';
import * as fs from 'fs';
import { ed25519 } from './tuf-client/util/key';

describe('sample verification', () => {
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

      const signedDataCanonical = canonicalize(timestamp.signed) || '';
      const te = new TextEncoder();
      const data = te.encode(signedDataCanonical);

      const result = crypto.verify(
        undefined,
        data,
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

      const signedDataCanonical =
        canonicalize({ ...timestamp.signed, foo: 'bar' }) || '';
      const te = new TextEncoder();
      const data = te.encode(signedDataCanonical);

      const result = crypto.verify(
        undefined,
        data,
        publicKey,
        Buffer.from(sig, 'hex')
      );
      expect(result).toBe(false);
    });
  });
});
