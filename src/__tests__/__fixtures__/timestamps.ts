import fs from 'fs';
import path from 'path';

export const timestampJson = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../../repository_data/metadata/timestamp.json'),
    'utf-8'
  )
);
