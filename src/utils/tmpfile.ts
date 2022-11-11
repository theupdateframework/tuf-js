import fs from 'fs/promises';
import os from 'os';
import path from 'path';

type TempFileHandler<T> = (file: fs.FileHandle) => Promise<T>;
type TempDirHandler<T> = (dir: string) => Promise<T>;

// Invokes the given handler with a handle to a temporary file. The file
// is deleted after the handler returns.
export const withTempFile = async <T>(
  handler: TempFileHandler<T>
): Promise<T> =>
  withTempDir(async (dir) => {
    const file = await fs.open(path.join(dir, 'tempfile'), 'w+');
    try {
      return await handler(file);
    } finally {
      file.close();
    }
  });

// Invokes the given handler with a temporary directory. The directory is
// deleted after the handler returns.
const withTempDir = async <T>(handler: TempDirHandler<T>) => {
  const tmpDir = await fs.realpath(os.tmpdir());
  const dir = await fs.mkdtemp(tmpDir + path.sep);

  try {
    return await handler(dir);
  } finally {
    fs.rmdir(dir, { recursive: true });
  }
};
