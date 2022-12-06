import fs from 'fs';
import path from 'path';

export const rootJson = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../../repository_data/metadata/root.json'),
    'utf-8'
  )
);

export const rawRootJson = fs.readFileSync(
  path.resolve(__dirname, '../../../repository_data/metadata/root.json')
);
