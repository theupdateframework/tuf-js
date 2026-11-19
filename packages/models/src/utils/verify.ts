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
  const signedData =
    key.signatureAlgorithm === 'ml-dsa-1'
      ? Buffer.concat([
          Buffer.from([0x74, 0x75, 0x66, 0x01]),
          crypto.createHash('sha512').update(canonicalData).digest(),
        ])
      : canonicalData;

  return crypto.verify(
    key.hashAlgorithm,
    signedData,
    key,
    Buffer.from(signature, 'hex')
  );
};
