import crypto from 'crypto';
import { CryptoError, UnsupportedAlgorithmError } from '../error';
import { encodeOIDString } from './oid';

const ASN1_TAG_SEQUENCE = 0x30;
const ANS1_TAG_BIT_STRING = 0x03;
const NULL_BYTE = 0x00;

const OID_EDDSA = '1.3.101.112';
const OID_EC_PUBLIC_KEY = '1.2.840.10045.2.1';
const OID_EC_CURVE_P256V1 = '1.2.840.10045.3.1.7';

interface KeyInfo {
  keyType: string;
  scheme: string;
  keyVal: string;
}

export function getPublicKey(keyInfo: KeyInfo): crypto.KeyObject {
  // If key is already PEM-encoded we can just parse it
  console.log('getPublicKey--------', keyInfo.keyVal);

  if (keyInfo.keyVal.startsWith('-----BEGIN PUBLIC KEY-----')) {
    return crypto.createPublicKey(keyInfo.keyVal);
  }

  // If key is not PEM-encoded it had better be hex
  if (!isHex(keyInfo.keyVal)) {
    throw new CryptoError('Invalid key format');
  }

  // Create proper DER format and convert it to PEM
  let der: Buffer;
  switch (keyInfo.keyType) {
    case 'rsa':
      throw new Error('not implemented');
    case 'ed25519':
      der = ed25519.hexToDER(keyInfo.keyVal);
      break;
    case 'ecdsa':
    case 'ecdsa-sha2-nistp256':
    case 'ecdsa-sha2-nistp384':
      der = ecdsa.hexToDER(keyInfo.keyVal);
      break;
    default:
      throw new UnsupportedAlgorithmError(
        `Unsupported key type: ${keyInfo.keyType}`
      );
  }

  return crypto.createPublicKey({
    key: der,
    format: 'der',
    type: 'spki',
  });
}

const ed25519 = {
  // Translates a hex key into a crypto KeyObject
  // https://keygen.sh/blog/how-to-use-hexadecimal-ed25519-keys-in-node/
  hexToDER: (hex: string): Buffer => {
    const key = Buffer.from(hex, 'hex');
    const oid = encodeOIDString(OID_EDDSA);

    // Create a byte sequence containing the OID and key
    const elements = Buffer.concat([
      Buffer.concat([
        Buffer.from([ASN1_TAG_SEQUENCE]),
        Buffer.from([oid.length]),
        oid,
      ]),
      Buffer.concat([
        Buffer.from([ANS1_TAG_BIT_STRING]),
        Buffer.from([key.length + 1]),
        Buffer.from([NULL_BYTE]),
        key,
      ]),
    ]);

    // Wrap up by creating a sequence of elements
    const der = Buffer.concat([
      Buffer.from([ASN1_TAG_SEQUENCE]),
      Buffer.from([elements.length]),
      elements,
    ]);

    return der;
  },
};

const ecdsa = {
  hexToDER: (hex: string): Buffer => {
    const key = Buffer.from(hex, 'hex');
    const bitString = Buffer.concat([
      Buffer.from([ANS1_TAG_BIT_STRING]),
      Buffer.from([key.length + 1]),
      Buffer.from([NULL_BYTE]),
      key,
    ]);

    const oids = Buffer.concat([
      encodeOIDString(OID_EC_PUBLIC_KEY),
      encodeOIDString(OID_EC_CURVE_P256V1),
    ]);

    const oidSequence = Buffer.concat([
      Buffer.from([ASN1_TAG_SEQUENCE]),
      Buffer.from([oids.length]),
      oids,
    ]);

    // Wrap up by creating a sequence of elements
    const der = Buffer.concat([
      Buffer.from([ASN1_TAG_SEQUENCE]),
      Buffer.from([oidSequence.length + bitString.length]),
      oidSequence,
      bitString,
    ]);

    return der;
  },
};

const isHex = (key: string): boolean => /^[0-9a-fA-F]+$/.test(key);
