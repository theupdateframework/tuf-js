import canonicalize from 'canonicalize';
import crypto from 'crypto';
import { ed25519, ecdsa } from './key';
import { JSONObject } from '../api/types';

export const verifySignature = (
  keyType: string,
  metaDataSignedData: JSONObject,
  signature: string,
  key: string
): boolean => {
  const signedDataCanonical = canonicalize(metaDataSignedData) || '';
  const data = new TextEncoder().encode(signedDataCanonical);

  if (keyType === 'ed25519') {
    const publicKey = ed25519.fromHex(key);

    const result = crypto.verify(
      undefined,
      data,
      publicKey,
      Buffer.from(signature, 'hex')
    );

    return result;
  } else if (keyType === 'ecdsa-sha2-nistp256') {
    const publicKey = ecdsa.fromHex(key);
    const result = crypto.verify(
      undefined,
      data,
      publicKey,
      Buffer.from(signature, 'hex')
    );

    console.log('verify ', result);

    return result;
  }

  return false;
};
