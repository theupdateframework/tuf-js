import { canonicalize } from '../../utils/json';

describe('canonicalize', () => {
  it('should canonicalize a string', () => {
    const json = { z: 'zee', a: 'aye', newline: 'foo\nbar', ary: [1, 2, 3] };
    expect(canonicalize(json)).toEqual(
      Buffer.from('{"a":"aye","ary":[1,2,3],"newline":"foo\nbar","z":"zee"}')
    );
  });
});
