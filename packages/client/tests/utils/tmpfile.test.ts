import fs from 'fs/promises';
import { tempFile } from '../../src/utils/tmpfile';

describe('tempFile', () => {
  it('creates a temporary file', async () => {
    let file: string;
    {
      await using temporaryFile = await tempFile();
      file = temporaryFile.path;

      await expect(fs.stat(file)).resolves.toBeTruthy();
    }

    await expect(fs.stat(file)).rejects.toThrow(/no such file/);
  });

  it('deletes the temporary file when the scope throws', async () => {
    let file = '';

    await expect(
      (async () => {
        await using temporaryFile = await tempFile();
        file = temporaryFile.path;
        throw new Error('test error');
      })()
    ).rejects.toThrow('test error');

    await expect(fs.stat(file)).rejects.toThrow(/no such file/);
  });
});
