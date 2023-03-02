import fs from 'fs';
import { withTempFile } from '../../utils/tmpfile';

describe('withTempFile', () => {
  it('creates a temporary file', async () => {
    const file = await withTempFile(async (tmpFileName) => {
      expect(tmpFileName).toBeTruthy();
      return tmpFileName;
    });

    // Check to make sure the file has been deleted
    expect(() => fs.openSync(file, 'r')).toThrow(/no such file/);
  });
});
