import { Updater } from '../../src/tuf-client/ng-client/updater';

function initDir() {}

function dowonloadTarget() {
  const updater = new Updater({ metadataBaseUrl: './', metadataDir: './' });
}

initDir();
dowonloadTarget();
