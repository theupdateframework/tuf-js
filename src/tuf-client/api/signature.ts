import { JSONObject } from '../utils/type';

export interface SignatureOptions {
  keyID: string;
  sig: string;
}

export class Signature {
  readonly keyID: string;
  readonly sig: string;

  constructor(options: SignatureOptions) {
    const { keyID, sig } = options;

    this.keyID = keyID;
    this.sig = sig;
  }

  public static fromJSON(data: JSONObject): Signature {
    const { keyid, sig } = data;

    if (typeof keyid !== 'string') {
      throw new TypeError('keyid must be a string');
    }

    if (typeof sig !== 'string') {
      throw new TypeError('sig must be a string');
    }

    return new Signature({
      keyID: keyid,
      sig: sig,
    });
  }
}
