import * as core from '@actions/core';
import fs from 'fs';
import path from 'path';
import { Updater } from '../src';

const metadataDir = './metadata';
const targetDir = './targets';
const rootFile = './1.root.json';

function initDir() {
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir);
  }

  if (!fs.existsSync(path.join(metadataDir, 'root.json'))) {
    fs.copyFileSync(rootFile, path.join(metadataDir, 'root.json'));
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
  }
}

async function downloadTarget(
  targetFile: string,
  metadataBaseUrl: string,
  targetBaseUrl: string
) {
  const updater = new Updater({
    metadataBaseUrl,
    metadataDir,
    targetDir,
    targetBaseUrl,
  });
  await updater.refresh();
  const targetInfo = await updater.getTargetInfo(targetFile);

  if (!targetInfo) {
    console.log(`Target ${targetFile} doesn't exist`);
    return;
  }
  const targetPath = await updater.findCachedTarget(targetInfo);
  if (targetPath) {
    console.log(`Target ${targetFile} is cached at ${targetPath}`);
    return;
  }

  const downloadedTargetPath = await updater.downloadTarget(targetInfo);
  console.log(`Target ${targetFile} downloaded to ${downloadedTargetPath}`);
}

try {
  const targetFile = core.getInput('targetFile');
  const metadataBaseUrl = core.getInput('metadataBaseUrl');
  const targetBaseUrl = core.getInput('targetBaseUrl');

  initDir();
  downloadTarget(targetFile, metadataBaseUrl, targetBaseUrl);
} catch (err) {
  core.setFailed(`Action failed with error ${err}`);
}
