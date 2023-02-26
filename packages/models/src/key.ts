import util from 'util';
import { Signable } from './base';
import { UnsignedMetadataError } from './error';
import { crypto, guard, JSONObject, JSONValue } from './utils';
import { getPublicKey } from './utils/key';

export interface KeyOptions {
  keyID: string;
  keyType: string;
  scheme: string;
  keyVal: Record<string, string>;
  unrecognizedFields?: Record<string, JSONValue>;
}

// A container class representing the public portion of a Key.
export class Key {
  readonly keyID: string;
  readonly keyType: string;
  readonly scheme: string;
  readonly keyVal: Record<string, string>;
  readonly unrecognizedFields?: Record<string, JSONValue>;

  constructor(options: KeyOptions) {
    const { keyID, keyType, scheme, keyVal, unrecognizedFields } = options;

    this.keyID = keyID;
    this.keyType = keyType;
    this.scheme = scheme;
    this.keyVal = keyVal;
    this.unrecognizedFields = unrecognizedFields || {};
  }

  // Verifies the that the metadata.signatures contains a signature made with
  // this key and is correctly signed.
  public verifySignature(metadata: Signable) {
    const signature = metadata.signatures[this.keyID];
    if (!signature)
      throw new UnsignedMetadataError('no signature for key found in metadata');

    if (!this.keyVal.public)
      throw new UnsignedMetadataError('no public key found');

    const publicKey = getPublicKey({
      keyType: this.keyType,
      scheme: this.scheme,
      keyVal: this.keyVal.public,
    });

    const signedData = metadata.signed.toJSON();

    try {
      if (!crypto.verifySignature(signedData, publicKey, signature.sig)) {
        throw new UnsignedMetadataError(
          `failed to verify ${this.keyID} signature`
        );
      }
    } catch (error) {
      if (error instanceof UnsignedMetadataError) {
        throw error;
      }

      throw new UnsignedMetadataError(
        `failed to verify ${this.keyID} signature`
      );
    }
  }

  public equals(other: Key): boolean {
    if (!(other instanceof Key)) {
      return false;
    }

    return (
      this.keyID === other.keyID &&
      this.keyType === other.keyType &&
      this.scheme === other.scheme &&
      util.isDeepStrictEqual(this.keyVal, other.keyVal) &&
      util.isDeepStrictEqual(this.unrecognizedFields, other.unrecognizedFields)
    );
  }

  public toJSON(): JSONObject {
    return {
      keytype: this.keyType,
      scheme: this.scheme,
      keyval: this.keyVal,
      ...this.unrecognizedFields,
    };
  }

  public static fromJSON(keyID: string, data: JSONObject): Key {
    const { keytype, scheme, keyval, ...rest } = data;

    if (typeof keytype !== 'string') {
      throw new TypeError('keytype must be a string');
    }

    if (typeof scheme !== 'string') {
      throw new TypeError('scheme must be a string');
    }

    if (!guard.isStringRecord(keyval)) {
      throw new TypeError('keyval must be a string record');
    }

    return new Key({
      keyID,
      keyType: keytype,
      scheme,
      keyVal: keyval,
      unrecognizedFields: rest,
    });
  }
}
