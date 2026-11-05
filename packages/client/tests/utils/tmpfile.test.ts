import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { withTempFile } from '../../src/utils/tmpfile';

describe('withTempFile', () => {
  it('creates a temporary file', async () => {
    const file = await withTempFile((tmpFileName) => {
      expect(tmpFileName).toBeTruthy();
      return Promise.resolve(tmpFileName);
    });

    await expect(fs.open(file)).rejects.toThrow(/no such file/);
  });

  it('stages under the supplied directory and cleans up on success', async () => {
    const parent = await fs.mkdtemp(path.join(os.tmpdir(), 'tuf-stage-'));
    try {
      const realParent = await fs.realpath(parent);
      await withTempFile(async (file) => {
        expect(path.dirname(path.dirname(file))).toBe(realParent);
        await fs.writeFile(file, 'complete target');
        expect(await fs.readFile(file, 'utf8')).toBe('complete target');
      }, parent);
      expect(await fs.readdir(parent)).toEqual([]);
    } finally {
      await fs.rm(parent, { recursive: true, force: true });
    }
  });

  it('cleans up destination-local staging when the handler rejects', async () => {
    const parent = await fs.mkdtemp(path.join(os.tmpdir(), 'tuf-stage-'));
    const error = new Error('publication failed');
    try {
      await expect(
        withTempFile(async (file) => {
          await fs.writeFile(file, 'complete target');
          throw error;
        }, parent)
      ).rejects.toBe(error);
      expect(await fs.readdir(parent)).toEqual([]);
    } finally {
      await fs.rm(parent, { recursive: true, force: true });
    }
  });
});
