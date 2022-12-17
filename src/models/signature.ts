import { JSONObject } from '../utils/types';

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
 * Provides utility methods to easily create an object from a dictionary
 * and return the dictionary representation of the object.
 */
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
