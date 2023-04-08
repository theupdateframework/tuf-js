import { canonicalize } from '../index';

describe('canonicalize', () => {
  describe('when the input is valid for canonicalization', () => {
    it('returns the encoded value', () => {
      expect(canonicalize('')).toBe('""');

      expect(canonicalize([1, 2, 3])).toBe('[1,2,3]');
      expect(canonicalize([])).toBe('[]');
      expect(canonicalize({})).toBe('{}');
      expect(canonicalize({ A: [99] })).toBe('{"A":[99]}');
      expect(canonicalize({ A: true })).toBe('{"A":true}');
      expect(canonicalize({ B: false })).toBe('{"B":false}');
      expect(canonicalize({ y: 2, x: 3 })).toBe('{"x":3,"y":2}');
      expect(canonicalize({ x: 3, y: null })).toBe('{"x":3,"y":null}');
      // Test escaping " and \
      expect(canonicalize('"')).toBe('"\\""');
      expect(canonicalize('\\')).toBe('"\\\\"');
      expect(canonicalize('\\"')).toBe('"\\\\\\""');
      // Newline handling
      expect(canonicalize('foo\nbar')).toBe('"foo\nbar"');
      // Combined
      const obj = {
        truthy: true,
        falsy: false,
        nullish: null,
        number: 42,
        string: 'foo',
        escape: '"foo"\\bar\nbaz',
        array: [1, 2, 3],
        object: { baz: 'qux', foo: 'bar' },
      };
      const expected =
        '{"array":[1,2,3],"escape":"\\"foo\\"\\\\bar\nbaz","falsy":false,"nullish":null,"number":42,"object":{"baz":"qux","foo":"bar"},"string":"foo","truthy":true}';
      expect(canonicalize(obj)).toBe(expected);
    });
  });
  describe('when the input is NOT valid for canonicalization', () => {
    it('throws an error', () => {
      expect(() => canonicalize(undefined)).toThrow(TypeError);
      expect(() => canonicalize(Symbol('foo'))).toThrow(TypeError);
      expect(() => canonicalize(3.14)).toThrow(TypeError);
      expect(() => canonicalize(BigInt(0))).toThrow(TypeError);
      expect(() => canonicalize({ a: undefined })).toThrow(TypeError);
    });
  });
});
