import canonicalize from 'canonicalize';
import * as elliptic from 'elliptic';
import * as fs from 'fs';

describe('sample verification', () => {
  var ec = new elliptic.eddsa('ed25519');

  const root = JSON.parse(fs.readFileSync('./examples/root.json').toString());
  const timestamp = JSON.parse(
    fs.readFileSync('./examples/timestamp.json').toString()
  );

  describe('when the signature is valid', () => {
    it('should verify', async () => {
      const signature = timestamp.signatures[0];
      const sig = signature.sig;

      const key = root.signed.keys[signature.keyid].keyval.public;
      const publicKey = ec.keyFromPublic(key);

      const signedDataCanonical = canonicalize(timestamp.signed) || '';

      const result = publicKey.verify(Buffer.from(signedDataCanonical), sig);
      expect(result).toBe(true);
    });
  });

  describe('when the signature is invalid', () => {
    it('should NOT verify', async () => {
      const signature = timestamp.signatures[0];
      const sig = signature.sig;

      const key = root.signed.keys[signature.keyid].keyval.public;
      const publicKey = ec.keyFromPublic(key);

      const signedDataCanonical =
        canonicalize({ ...timestamp.signed, foo: 'bar' }) || '';

      const result = publicKey.verify(Buffer.from(signedDataCanonical), sig);
      expect(result).toBe(false);
    });
  });
});
