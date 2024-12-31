import { digestSHA256, generateKeyPair, signSHA256 } from '../src/crypto';

describe('crypto', () => {
  describe('digestSHA256', () => {
    it('digests data', () => {
      expect(digestSHA256('hello, world!')).toEqual(
        '68e656b251e67e8358bef8483ab0d51c6619f3e7a1a9f0e75838d41ff368f728'
      );
    });
  });

  describe('generateKeyPair', () => {
    it('generates a key pair', () => {
      const keyPair = generateKeyPair();
      expect(keyPair).toBeTruthy();
      expect(keyPair.publicKey).toBeTruthy();
      expect(keyPair.publicKey.asymmetricKeyType).toBe('ec');

      expect(keyPair.privateKey).toBeTruthy();
      expect(keyPair.privateKey.asymmetricKeyType).toBe('ec');
    });
  });

  describe('signSHA256', () => {
    it('signs data', () => {
      const keyPair = generateKeyPair();
      const data = Buffer.from('hello, world!');
      const signature = signSHA256(keyPair.privateKey, data);
      expect(signature).toBeTruthy();
    });
  });
});
