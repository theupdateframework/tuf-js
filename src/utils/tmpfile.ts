import fs from 'fs/promises';
import os from 'os';
import path from 'path';

type TmpFileHandler<T> = (
  tmpFile: fs.FileHandle,
  tmpFilePath: string
) => Promise<T>;
type TmpDirHandler<T> = (dir: string) => Promise<T>;

// Invokes the given handler with a handle to a temporary file. The file
// is deleted after the handler returns.
export const withTempFile = async <T>(handler: TmpFileHandler<T>): Promise<T> =>
  withTempDir(async (dir) => {
    const tmpFilePath = path.join(dir, 'tempfile');
    const tmpFile = await fs.open(tmpFilePath, 'w+');
    try {
      return await handler(tmpFile, tmpFilePath);
    } finally {
      tmpFile.close();
    }
  });

// Invokes the given handler with a temporary directory. The directory is
// deleted after the handler returns.
const withTempDir = async <T>(handler: TmpDirHandler<T>) => {
  const tmpDir = await fs.realpath(os.tmpdir());
  const dir = await fs.mkdtemp(tmpDir + path.sep);
  try {
    return await handler(dir);
  } finally {
    fs.rm(dir, { recursive: true });
  }
};
