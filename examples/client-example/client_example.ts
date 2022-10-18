import { Updater } from '../../src';

function initDir() {}

async function dowonloadTarget() {
  const updater = new Updater({
    metadataBaseUrl: 'https://sigstore-tuf-root.storage.googleapis.com',
    metadataDir: './',
  });
  await updater.refresh();
}

initDir();
dowonloadTarget();
