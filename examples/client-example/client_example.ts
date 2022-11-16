import { Updater } from '../../src';

function initDir() {}

const target = 'file2.txt';

const metadataBaseUrl = 'http://127.0.0.1:8000/metadata';
const metadataDir = './';
const targetDir = './';
const targetBaseUrl = 'http://127.0.0.1:8000/targets';

async function downloadTarget() {
  const updater = new Updater({
    metadataBaseUrl,
    metadataDir,
    targetDir,
    targetBaseUrl,
  });
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
