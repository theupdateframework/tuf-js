import { mkdtemp, open, realpath, rm } from 'fs/promises';
import os from 'os';
import path from 'path';

interface TempFile extends AsyncDisposable {
  path: string;
}

export async function tempFile(): Promise<TempFile> {
  const tmpDir = await realpath(os.tmpdir());
  const dir = await mkdtemp(tmpDir + path.sep);
  const file = path.join(dir, 'tempfile');

  try {
    await (await open(file, 'a')).close();
  } catch (error) {
    await rm(dir, { force: true, recursive: true, maxRetries: 3 });
    throw error;
  }

  return {
    path: file,
    async [Symbol.asyncDispose]() {
      await rm(dir, { force: true, recursive: true, maxRetries: 3 });
    },
  };
}
