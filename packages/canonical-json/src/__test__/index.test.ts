// describe('canonicalize', () => {
//   describe('when the input is valid for canonicalization', () => {
//     it('returns the encoded value', () => {
//       const encode = json.canonicalize;
//       expect(encode('')).toBe('""');
//       assert.strictEqual(encode([1, 2, 3]), '[1,2,3]');
//       assert.strictEqual(encode([]), '[]');
//       assert.strictEqual(encode({}), '{}');
//       assert.strictEqual(encode({ A: [99] }), '{"A":[99]}');
//       assert.strictEqual(encode({ A: true }), '{"A":true}');
//       assert.strictEqual(encode({ B: false }), '{"B":false}');
//       assert.strictEqual(encode({ y: 2, x: 3 }), '{"x":3,"y":2}');
//       assert.strictEqual(encode({ x: 3, y: null }), '{"x":3,"y":null}');

//       // Test escaping " and \
//       assert.strictEqual(encode('"'), '"\\""');
//       assert.strictEqual(encode('\\'), '"\\\\"');
//       assert.strictEqual(encode('\\"'), '"\\\\\\""');

//       // Newline handling
//       assert.strictEqual(encode('foo\nbar'), '"foo\nbar"');

//       // Combined
//       const obj = {
//         truthy: true,
//         falsy: false,
//         nullish: null,
//         number: 42,
//         string: 'foo',
//         escape: '"foo"\\bar\nbaz',
//         array: [1, 2, 3],
//         object: { baz: 'qux', foo: 'bar' },
//       };

//       const expected =
//         '{"array":[1,2,3],"escape":"\\"foo\\"\\\\bar\nbaz","falsy":false,"nullish":null,"number":42,"object":{"baz":"qux","foo":"bar"},"string":"foo","truthy":true}';

//       assert.strictEqual(encode(obj), expected);
//     });
//   });

//   describe('when the input is NOT valid for canonicalization', () => {
//     it('throws an error', () => {
//       const encode = json.canonicalize;

//       assert.throws(() => encode(undefined), TypeError);
//       assert.throws(() => encode(Symbol('foo')), TypeError);
//       assert.throws(() => encode(3.14), TypeError);
//       assert.throws(() => encode(BigInt(0)), TypeError);
//       assert.throws(() => encode({ a: undefined }), TypeError);
//     });
//   });
// });
