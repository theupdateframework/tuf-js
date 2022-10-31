import crypto from 'crypto';
import { JSONObject } from '../utils/types';
import { canonicalize } from './json';

export const verifySignature = (
  metaDataSignedData: JSONObject,
  key: crypto.KeyObject,
  signature: string
): boolean => {
  const canonicalData = canonicalize(metaDataSignedData) || '';

  return crypto.verify(
    undefined,
    canonicalData,
    key,
    Buffer.from(signature, 'hex')
  );
};
