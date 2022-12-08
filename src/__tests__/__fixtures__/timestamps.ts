import fs from 'fs';
import path from 'path';

export const rawTimestampJson = fs.readFileSync(
  path.resolve(__dirname, '../../../repository_data/metadata/timestamp.json'),
  'utf8'
);

export const timestampJson = JSON.parse(rawTimestampJson);
