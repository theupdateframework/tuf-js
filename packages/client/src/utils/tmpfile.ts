import fs from 'fs';
import os from 'os';
import path from 'path';

type TempFileHandler<T> = (file: string) => Promise<T>;

// Invokes the given handler with the path to a temporary file. The file
// is deleted after the handler returns.
export const withTempFile = async <T>(
  handler: TempFileHandler<T>
): Promise<T> =>
  withTempDir(async (dir) => handler(path.join(dir, 'tempfile')));

// Invokes the given handler with a temporary directory. The directory is
// deleted after the handler returns.
const withTempDir = async <T>(handler: TempFileHandler<T>) => {
  const tmpDir = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(tmpDir + path.sep);

  try {
    return await handler(dir);
  } finally {
    fs.rmdirSync(dir, { recursive: true, maxRetries: 3 });
  }
};
