import { canonicalize } from '../../utils/json';

describe('canonicalize', () => {
  it('should canonicalize a string', () => {
    const json = { z: 'zee', a: 'aye', newline: 'foo\nbar' };
    expect(canonicalize(json)).toEqual(
      Buffer.from('{"a":"aye","newline":"foo\nbar","z":"zee"}')
    );
  });
});
