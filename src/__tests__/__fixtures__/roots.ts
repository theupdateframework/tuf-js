import fs from 'fs';
import path from 'path';

export const rawRootJson = fs.readFileSync(
  path.resolve(__dirname, '../../../repository_data/metadata/root.json'),
  'utf8'
);

export const rootJson = JSON.parse(rawRootJson);
