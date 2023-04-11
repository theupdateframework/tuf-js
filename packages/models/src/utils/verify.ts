import { canonicalize } from '@tufjs/canonical-json';
import crypto from 'crypto';
import { JSONObject } from '../utils/types';

export const verifySignature = (
  metaDataSignedData: JSONObject,
  key: crypto.VerifyKeyObjectInput,
  signature: string
): boolean => {
  const canonicalData = Buffer.from(canonicalize(metaDataSignedData));

  return crypto.verify(
    undefined,
    canonicalData,
    key,
    Buffer.from(signature, 'hex')
  );
};
