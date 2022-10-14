import crypto from 'crypto';

const ANS1_TAG_OID = 0x06;
const ASN1_TAG_SEQUENCE = 0x30;
const ANS1_TAG_BIT_STRING = 0x03;
const NULL_BYTE = 0x00;

const OID_EDDSA = '1.3.101.112';
const OID_EC_PUBLIC_KEY = '1.2.840.10045.2.1';
const OID_EC_CURVE_P256V1 = '1.2.840.10045.3.1.7';

export const ed25519 = {
  // Translates a hex key into a crypto KeyObject
  // https://keygen.sh/blog/how-to-use-hexadecimal-ed25519-keys-in-node/
  fromHex: (hex: string): crypto.KeyObject => {
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

    return crypto.createPublicKey({
      key: der,
      format: 'der',
      type: 'spki',
    });
  },
};

export const ecdsa = {
  fromHex: (hex: string): crypto.KeyObject => {
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

    return crypto.createPublicKey({
      key: der,
      format: 'der',
      type: 'spki',
    });
  },
};

export function encodeOIDString(oid: string): Buffer {
  const parts = oid.split('.');

  // The first two subidentifiers are encoded into the first byte
  const first = parseInt(parts[0], 10) * 40 + parseInt(parts[1], 10);

  let rest: number[] = [];
  parts.slice(2).forEach((part) => {
    const bytes = encodeVariableLengthInteger(parseInt(part, 10));
    rest.push(...bytes);
  });

  const der = Buffer.from([first, ...rest]);
  return Buffer.from([ANS1_TAG_OID, der.length, ...der]);
}

function encodeVariableLengthInteger(value: number): number[] {
  const bytes: number[] = [];
  let mask = 0x00;
  while (value > 0) {
    bytes.unshift((value & 0x7f) | mask);
    value >>= 7;
    mask = 0x80;
  }
  return bytes;
}
