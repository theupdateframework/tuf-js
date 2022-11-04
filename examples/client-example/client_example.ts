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

async function downloadTarget() {
  const argv = process.argv;
  if (argv.length < 3) {
    console.log('Please enter the file name');
  } else {
    let target = argv[2];
    let metadataBaseUrl = 'http://[::]:8000/metadata';
    let metadataDir = './local/';
    let targetDir = './local/';
    let targetBaseUrl = 'http://[::]:8000/targets';

    if (argv[2] === 'sigstore' || argv[2] === '-s') {
      metadataBaseUrl = 'https://sigstore-tuf-root.storage.googleapis.com';
      metadataDir = './sigstore/';
      targetDir = './sigstore/';
      targetBaseUrl = metadataBaseUrl + '/targets';
      target = argv[3];
    }

    console.log(`Fetch data from ${metadataBaseUrl}`);

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
}

initDir();
downloadTarget();
