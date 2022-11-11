import { withTempFile } from '../../utils/tmpfile';

describe('withTempFile', () => {
  it('creates a temporary file', async () => {
    const file = await withTempFile(async (tmpFile) => {
      expect(tmpFile).toBeTruthy();
      return tmpFile;
    });

    // Check to make sure the file is closed
    await expect(file.readFile()).rejects.toThrow(/file closed/);
  });
});
