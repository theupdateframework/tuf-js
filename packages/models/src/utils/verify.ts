import { canonicalize } from '@tufjs/canonical-json';
import crypto from 'crypto';
import { JSONObject } from '../utils/types';
import { PublicKey } from './key';

export const verifySignature = (
  metaDataSignedData: JSONObject,
  key: PublicKey,
  signature: string
): boolean => {
  const canonicalData = Buffer.from(canonicalize(metaDataSignedData));

  return crypto.verify(
    key.hashAlgorithm,
    canonicalData,
    key,
    Buffer.from(signature, 'hex')
  );
};
