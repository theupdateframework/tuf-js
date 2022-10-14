import { encodeOIDString, ecdsa, ed25519 } from './key';

describe('encodeOIDString', () => {
  it('encodes OIDs propertly', () => {
    let r = encodeOIDString('1.3.6.1.4.1.311.21.20');
    expect(r).toEqual(Buffer.from('06092b0601040182371514', 'hex'));

    r = encodeOIDString('1.2.840.10045.2.1');
    expect(r).toEqual(Buffer.from('06072a8648ce3d0201', 'hex'));

    r = encodeOIDString('1.2.840.10045.3.1.7');
    expect(r).toEqual(Buffer.from('06082a8648ce3d030107', 'hex'));

    r = encodeOIDString('1.3.6.1.4.1.57264.1.3');
    expect(r).toEqual(Buffer.from('060a2b0601040183bf300103', 'hex'));

    r = encodeOIDString('2.3.21925.1');
    expect(r).toEqual(Buffer.from('06055381ab2501', 'hex'));
  });
});

describe('ed25519', () => {
  const bit =
    'edcd0a32a07dce33f7c7873aaffbff36d20ea30787574ead335eefd337e4dacd';
  it('encodes keys properly', () => {
    const pem = ed25519.fromHex(bit);
    expect(pem.type).toEqual('public');
    expect(pem.asymmetricKeyType).toEqual('ed25519');

    // Only exists in Node 16+
    if (pem.asymmetricKeyDetails) {
      expect(pem.asymmetricKeyDetails).toEqual({});
    }
  });
});

describe('ecdsa', () => {
  const bit =
    '04cbc5cab2684160323c25cd06c3307178a6b1d1c9b949328453ae473c5ba7527e35b13f298b41633382241f3fd8526c262d43b45adee5c618fa0642c82b8a9803';
  describe('fromHex', () => {
    it('encodes a public key', () => {
      const pem = ecdsa.fromHex(bit);
      expect(pem.type).toEqual('public');
      expect(pem.asymmetricKeyType).toEqual('ec');

      // Only exists in Node 16+
      if (pem.asymmetricKeyDetails) {
        expect(pem.asymmetricKeyDetails).toEqual({ namedCurve: 'prime256v1' });
      }
    });
  });
});
