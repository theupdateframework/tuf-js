import { JSONObject } from './utils';

export interface SignatureOptions {
  keyID: string;
  sig: string;
}

/**
 * A container class containing information about a signature.
 *
 * Contains a signature and the keyid uniquely identifying the key used
 * to generate the signature.
 *
 * Provide a `fromJSON` method to create a Signature from a JSON object.
 */
export class Signature {
  readonly keyID: string;
  readonly sig: string;

  constructor(options: SignatureOptions) {
    const { keyID, sig } = options;

    this.keyID = keyID;
    this.sig = sig;
  }

  public toJSON(): JSONObject {
    return {
      keyid: this.keyID,
      sig: this.sig,
    };
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
