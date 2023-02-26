import { Key, Signature } from '@tufjs/models';
import { digestSHA256, generateKeyPair, KeyObject, signSHA256 } from './crypto';

export class KeyPair {
  private privateKey: KeyObject;
  public publicKey: Key;

  constructor() {
    const { privateKey, publicKey } = generateKeyPair();
    this.privateKey = privateKey;
    this.publicKey = this.toPublicKeyMeta(publicKey);
  }

  public sign(data: Buffer): Signature {
    const sig = signSHA256(this.privateKey, data);
    return new Signature({ keyID: this.publicKey.keyID, sig });
  }

  private toPublicKeyMeta(publicKey: KeyObject): Key {
    const meta = {
      keyType: 'ecdsa-sha2-nistp256',
      scheme: 'ecdsa-sha2-nistp256',
      keyVal: {
        public: publicKey.export({ format: 'pem', type: 'spki' }).toString(),
      },
    };

    const canonical = JSON.stringify(meta);
    const keyid = digestSHA256(canonical);

    return new Key({ keyID: keyid, ...meta });
  }
}
