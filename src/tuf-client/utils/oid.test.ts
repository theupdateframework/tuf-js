import { encodeOIDString } from './oid';

describe('encodeOIDString', () => {
  const testCases = [
    { oid: '1.3.6.1.4.1.311.21.20', expected: '06092b0601040182371514' },
    { oid: '1.2.840.10045.2.1', expected: '06072a8648ce3d0201' },
    { oid: '1.2.840.10045.3.1.7', expected: '06082a8648ce3d030107' },
    { oid: '1.3.6.1.4.1.57264.1.3', expected: '060a2b0601040183bf300103' },
    { oid: '2.3.21925.1', expected: '06055381ab2501' },
  ];

  it('encodes OIDs propertly', () => {
    testCases.forEach(({ oid, expected }) => {
      const r = encodeOIDString(oid);
      expect(r).toEqual(Buffer.from(expected, 'hex'));
    });
  });
});
