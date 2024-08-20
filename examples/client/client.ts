import fs from 'fs';
import path from 'path';
import { Updater } from '../../packages/client/src';

const target = 'file1.txt';

const baseURL = 'http://127.0.0.1:8080';
const metadataDir = './metadata';
const targetDir = './targets';

function initDir() {
  // Create cache directory if it doesn't already exist
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir);
  }

  // Create the target download dir if it doesn't already exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
  }

  // Ensure initial root.json is present in the cache
  const rootFilePath = path.join(metadataDir, 'root.json');
  if (!fs.existsSync(rootFilePath)) {
    fs.copyFileSync('./1.root.json', rootFilePath);
  }
}

async function downloadTarget() {
  const updater = new Updater({
    metadataBaseUrl: `${baseURL}/metadata`,
    targetBaseUrl: `${baseURL}/targets`,
    metadataDir,
    targetDir,
  });
  // ensure to refresh the metadata before downloading the target
  // refresh should be called once after the client is initialized
  await updater.refresh();

  const targetInfo = await updater.getTargetInfo(target);

  if (!targetInfo) {
    console.log(`Target ${target} doesn't exist`);
    return;
  }
  const targetPath = await updater.findCachedTarget(targetInfo);
  if (targetPath) {
    console.log(`Target ${target} is cached at ${targetPath}`);
    return;
  }

  const targetFile = await updater.downloadTarget(targetInfo);
  console.log(`Target ${target} downloaded to ${targetFile}`);
}

initDir();
downloadTarget();
