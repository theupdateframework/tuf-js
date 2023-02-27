import crypto from 'crypto';
export type { KeyObject } from 'crypto';

// Returns an ECDSA key pair
export function generateKeyPair(): crypto.KeyPairKeyObjectResult {
  return crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
}

// Returns a hex-encoded SHA256 digest
export function digestSHA256(data: crypto.BinaryLike): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Returns a hex-encoded SHA256 signature
export function signSHA256(key: crypto.KeyObject, data: Buffer): string {
  return crypto.createSign('sha256').update(data).sign(key).toString('hex');
}
