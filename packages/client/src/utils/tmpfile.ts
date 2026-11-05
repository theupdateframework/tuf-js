import fs from 'fs/promises';
import os from 'os';
import path from 'path';

type TempFileHandler<T> = (file: string) => Promise<T>;

// Invokes the handler with a temporary file path, optionally under directory.
// The temporary directory is deleted after the handler returns.
export const withTempFile = async <T>(
  handler: TempFileHandler<T>,
  directory?: string
): Promise<T> =>
  withTempDir(async (dir) => handler(path.join(dir, 'tempfile')), directory);

const withTempDir = async <T>(
  handler: TempFileHandler<T>,
  directory?: string
) => {
  const tmpDir = await fs.realpath(directory ?? os.tmpdir());
  const dir = await fs.mkdtemp(tmpDir + path.sep);

  try {
    return await handler(dir);
  } finally {
    await fs.rm(dir, { force: true, recursive: true, maxRetries: 3 });
  }
};
