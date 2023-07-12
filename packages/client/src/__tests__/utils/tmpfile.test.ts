import fs from 'fs/promises';
import { withTempFile } from '../../utils/tmpfile';

describe('withTempFile', () => {
  it('creates a temporary file', async () => {
    const file = await withTempFile((tmpFileName) => {
      expect(tmpFileName).toBeTruthy();
      return Promise.resolve(tmpFileName);
    });

    // Check to make sure the file has been deleted
    await expect(fs.open(file)).rejects.toThrow(/no such file/);
  });
});
