import { Updater } from '../../src/tuf-client/ng-client/updater';

function initDir() {}

async function downloadTarget() {
  const updater = new Updater({
    metadataBaseUrl: 'https://sigstore-tuf-root.storage.googleapis.com',
    metadataDir: './',
  });
  await updater.refresh();
}

initDir();
downloadTarget();
