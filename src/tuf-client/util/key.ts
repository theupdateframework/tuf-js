import crypto from 'crypto';

export const ed25519 = {
  // Translates a hex key into a crypto KeyObject
  // https://keygen.sh/blog/how-to-use-hexadecimal-ed25519-keys-in-node/
  fromHex: (hex: string): crypto.KeyObject => {
    const key = Buffer.from(hex, 'hex');

    // Ed25519's OID
    const oid = Buffer.from([0x06, 0x03, 0x2b, 0x65, 0x70]);

    // Create a byte sequence containing the OID and key
    const elements = Buffer.concat([
      Buffer.concat([
        Buffer.from([0x30]), // Sequence tag
        Buffer.from([oid.length]),
        oid,
      ]),
      Buffer.concat([
        Buffer.from([0x03]), // Bit tag
        Buffer.from([key.length + 1]),
        Buffer.from([0x00]), // Zero bit
        key,
      ]),
    ]);

    // Wrap up by creating a sequence of elements
    const der = Buffer.concat([
      Buffer.from([0x30]), // Sequence tag
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
