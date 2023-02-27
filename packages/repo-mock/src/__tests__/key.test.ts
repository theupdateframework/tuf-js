import { KeyPair } from '../key';

describe('KeyPair', () => {
  describe('constructor', () => {
    it('creates a new key pair', () => {
      const keyPair = new KeyPair();
      expect(keyPair).toBeTruthy();
    });
  });

  describe('#publicKey', () => {
    it('returns the public key', () => {
      const keyPair = new KeyPair();
      expect(keyPair.publicKey).toBeTruthy();
      expect(keyPair.publicKey.keyType).toBe('ecdsa-sha2-nistp256');
      expect(keyPair.publicKey.scheme).toBe('ecdsa-sha2-nistp256');
      expect(keyPair.publicKey.keyVal).toHaveProperty('public');
      expect(keyPair.publicKey.keyVal.public).toBeTruthy();
      expect(keyPair.publicKey.keyID).toBeTruthy();
    });
  });

  describe('#sign', () => {
    it('signs data', () => {
      const keyPair = new KeyPair();
      const data = Buffer.from('hello, world!');
      const signature = keyPair.sign(data);
      expect(signature).toBeTruthy();
      expect(signature.keyID).toBe(keyPair.publicKey.keyID);
      expect(signature.sig).toBeTruthy();
    });
  });
});
