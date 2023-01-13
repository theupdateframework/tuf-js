import fs from 'fs';
import fetch from 'make-fetch-happen';
import path from 'path';
import { Updater } from '../src';

async function initDir(
  rootMetadataUrl: string,
  metadataDir: string,
  targetDir: string
) {
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir);
  }

  if (!fs.existsSync(path.join(metadataDir, 'root.json'))) {
    // install 1.root.json

    const response = await fetch(rootMetadataUrl);
    const data = await response.json();
    fs.writeFileSync(path.join(metadataDir, 'root.json'), JSON.stringify(data));
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
  }
}

async function downloadTarget(
  targetFiles: string[],
  metadataBaseUrl: string,
  targetBaseUrl: string,
  metadataDir: string,
  targetDir: string
) {
  const updater = new Updater({
    metadataBaseUrl,
    metadataDir,
    targetDir,
    targetBaseUrl,
  });
  await updater.refresh();

  for (const targetFile of targetFiles) {
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
}

async function removeDirs(metadataDir: string, targetDir: string) {
  if (fs.existsSync(metadataDir)) {
    fs.rmSync(metadataDir, { recursive: true });
  }

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true });
  }
}

async function run() {
  const configFile = process.argv[2];
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  const rootMetadataUrl = config.rootMetadataUrl;
  const metadataBaseUrl = config.metadataBaseUrl;
  const targetBaseUrl = config.targetBaseUrl;
  const rawTargetFiles = config.targetFiles;

  const metadataDir = './metadata';
  const targetDir = './targets';

  const targetFiles = rawTargetFiles.split(',');

  await initDir(rootMetadataUrl, metadataDir, targetDir);

  await downloadTarget(
    targetFiles,
    metadataBaseUrl,
    targetBaseUrl,
    metadataDir,
    targetDir
  );

  // clean up the data
  await removeDirs(metadataDir, targetDir);
  process.exit();
}

try {
  run();
} catch (err) {
  console.log('Error', err);
  process.exit(1);
}
