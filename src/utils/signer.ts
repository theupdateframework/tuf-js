import canonicalize from 'canonicalize';
import crypto from 'crypto';
import { JSONObject } from '../models';

export const verifySignature = (
  metaDataSignedData: JSONObject,
  key: crypto.KeyObject,
  signature: string
): boolean => {
  const signedDataCanonical = canonicalize(metaDataSignedData) || '';
  const data = new TextEncoder().encode(signedDataCanonical);

  return crypto.verify(undefined, data, key, Buffer.from(signature, 'hex'));
};
