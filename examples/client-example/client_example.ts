import { Updater } from '../../src';

function initDir() {}

// Target example:
// artifact.pub
// ctfe.pub
// ctfe_2022.pub
// fulcio.crt.pem
// fulcio_intermediate_v1.crt.pem
// fulcio_v1.crt.pem
// rekor.pub
const target = 'rekor.pub';

const metadataBaseUrl = 'https://sigstore-tuf-root.storage.googleapis.com';
const metadataDir = './';
const targetDir = './';
const targetBaseUrl = metadataBaseUrl + '/targets';

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
