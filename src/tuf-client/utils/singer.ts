import canonicalize from 'canonicalize';
import crypto from 'crypto';
import { ed25519 } from './key';

export const verifySignature = (
  metaDataSignedData: string,
  signature: string,
  key: string,
  keyType: string
): boolean => {
  if (keyType === 'ed25519') {
    const publicKey = ed25519.fromHex(key);

    const signedDataCanonical = canonicalize(metaDataSignedData) || '';
    const data = new TextEncoder().encode(signedDataCanonical);

    const result = crypto.verify(
      undefined,
      data,
      publicKey,
      Buffer.from(signature, 'hex')
    );

    return result;
  }

  return false;
};
