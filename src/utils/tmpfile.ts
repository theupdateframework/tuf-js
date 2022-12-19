import fs from 'fs/promises';
import os from 'os';
import path from 'path';

type TempFileHandler<T> = (file: fs.FileHandle, filePath: string) => Promise<T>;
type TempDirHandler<T> = (dir: string) => Promise<T>;

// Invokes the given handler with a handle to a temporary file. The file
// is deleted after the handler returns.
export const withTempFile = async <T>(
  handler: TempFileHandler<T>
): Promise<T> =>
  withTempDir(async (dir) => {
    const filePath = path.join(dir, 'tempfile');
    const file = await fs.open(filePath, 'w+');
    try {
      return await handler(file, filePath);
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
    fs.rm(dir, { recursive: true });
  }
};
