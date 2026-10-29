import crypto, { KeyObject, VerifyKeyObjectInput } from 'crypto';
import { CryptoError, UnsupportedAlgorithmError } from '../error';
import { encodeOIDString } from './oid';

const ASN1_TAG_SEQUENCE = 0x30;
const ANS1_TAG_BIT_STRING = 0x03;
const NULL_BYTE = 0x00;

const OID_EDDSA = '1.3.101.112';
const OID_EC_PUBLIC_KEY = '1.2.840.10045.2.1';
const OID_EC_CURVE_P256V1 = '1.2.840.10045.3.1.7';
const OID_EC_CURVE_P384 = '1.3.132.0.34';

const PEM_HEADER = '-----BEGIN PUBLIC KEY-----';

interface KeyInfo {
  keyType: string;
  scheme: string;
  keyVal: string;
}

export interface PublicKey extends VerifyKeyObjectInput {
  hashAlgorithm?: string;
}

export function getPublicKey(keyInfo: KeyInfo): PublicKey {
  switch (keyInfo.keyType) {
    case 'rsa':
      return getRSAPublicKey(keyInfo);
    case 'ed25519':
      return getED25519PublicKey(keyInfo);
    case 'ecdsa':
    case 'ecdsa-sha2-nistp256':
    case 'ecdsa-sha2-nistp384':
      return getECDCSAPublicKey(keyInfo);
    default:
      throw new UnsupportedAlgorithmError(
        `Unsupported key type: ${keyInfo.keyType}`
      );
  }
}

function getRSAPublicKey(keyInfo: KeyInfo): PublicKey {
  // Only support PEM-encoded RSA keys
  if (!keyInfo.keyVal.startsWith(PEM_HEADER)) {
    throw new CryptoError('Invalid key format');
  }

  const key = crypto.createPublicKey(keyInfo.keyVal);

  switch (keyInfo.scheme) {
    case 'rsassa-pss-sha256':
    case 'rsassa-pss-sha384':
    case 'rsassa-pss-sha512':
      return {
        key: key,
        hashAlgorithm: keyInfo.scheme.slice('rsassa-pss-'.length),
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      };
    default:
      throw new UnsupportedAlgorithmError(
        `Unsupported RSA scheme: ${keyInfo.scheme}`
      );
  }
}

function getED25519PublicKey(keyInfo: KeyInfo): VerifyKeyObjectInput {
  let key: KeyObject;
  // If key is already PEM-encoded we can just parse it
  if (keyInfo.keyVal.startsWith(PEM_HEADER)) {
    key = crypto.createPublicKey(keyInfo.keyVal);
  } else {
    // If key is not PEM-encoded it had better be hex
    if (!isHex(keyInfo.keyVal)) {
      throw new CryptoError('Invalid key format');
    }

    key = crypto.createPublicKey({
      key: ed25519.hexToDER(keyInfo.keyVal),
      format: 'der',
      type: 'spki',
    });
  }

  return { key };
}

function getECDCSAPublicKey(keyInfo: KeyInfo): PublicKey {
  let namedCurve: string;
  let curveOID: string;
  let hashAlgorithm: string;
  switch (keyInfo.scheme) {
    case 'ecdsa-sha2-nistp256':
      namedCurve = 'prime256v1';
      curveOID = OID_EC_CURVE_P256V1;
      hashAlgorithm = 'sha256';
      break;
    case 'ecdsa-sha2-nistp384':
      namedCurve = 'secp384r1';
      curveOID = OID_EC_CURVE_P384;
      hashAlgorithm = 'sha384';
      break;
    default:
      throw new UnsupportedAlgorithmError(
        `Unsupported ECDSA scheme: ${keyInfo.scheme}`
      );
  }

  if (keyInfo.keyType !== 'ecdsa' && keyInfo.keyType !== keyInfo.scheme) {
    throw new CryptoError('ECDSA key type does not match scheme');
  }

  let key: KeyObject;
  // If key is already PEM-encoded we can just parse it
  if (keyInfo.keyVal.startsWith(PEM_HEADER)) {
    key = crypto.createPublicKey(keyInfo.keyVal);
  } else {
    // If key is not PEM-encoded it had better be hex
    if (!isHex(keyInfo.keyVal)) {
      throw new CryptoError('Invalid key format');
    }

    key = crypto.createPublicKey({
      key: ecdsa.hexToDER(keyInfo.keyVal, curveOID),
      format: 'der',
      type: 'spki',
    });
  }

  if (
    key.asymmetricKeyType !== 'ec' ||
    key.asymmetricKeyDetails?.namedCurve !== namedCurve
  ) {
    throw new CryptoError('ECDSA key curve does not match scheme');
  }

  return { key, hashAlgorithm };
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
  hexToDER: (hex: string, curveOID: string): Buffer => {
    const key = Buffer.from(hex, 'hex');
    const bitString = Buffer.concat([
      Buffer.from([ANS1_TAG_BIT_STRING]),
      Buffer.from([key.length + 1]),
      Buffer.from([NULL_BYTE]),
      key,
    ]);

    const oids = Buffer.concat([
      encodeOIDString(OID_EC_PUBLIC_KEY),
      encodeOIDString(curveOID),
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
