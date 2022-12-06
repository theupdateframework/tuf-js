import fs from 'fs';
import path from 'path';

export const snapshotJson = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../../repository_data/metadata/snapshot.json'),
    'utf-8'
  )
);

export const rawSnapshotJson = fs.readFileSync(
  path.resolve(__dirname, '../../../repository_data/metadata/snapshot.json'),
  'utf8'
);
