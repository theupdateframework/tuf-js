import * as tuf from '@tufjs/models';
import { digestSHA256, generateKeyPair, KeyObject, signSHA256 } from './crypto';

export class KeyPair {
  private privateKey: KeyObject;
  public publicKey: tuf.Key;

  constructor() {
    const { privateKey, publicKey } = generateKeyPair();
    this.privateKey = privateKey;
    this.publicKey = toPublicKeyMeta(publicKey);
  }

  public sign(data: Buffer): tuf.Signature {
    const sig = signSHA256(this.privateKey, data);
    return new tuf.Signature({ keyID: this.publicKey.keyID, sig });
  }
}

function toPublicKeyMeta(publicKey: KeyObject): tuf.Key {
  const meta = {
    keyType: 'ecdsa-sha2-nistp256',
    scheme: 'ecdsa-sha2-nistp256',
    keyVal: {
      public: publicKey.export({ format: 'pem', type: 'spki' }).toString(),
    },
  };

  const canonical = JSON.stringify(meta);
  const keyid = digestSHA256(canonical);

  return new tuf.Key({ keyID: keyid, ...meta });
}
