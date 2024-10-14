#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { Updater } = require('tuf-js')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

yargs(hideBin(process.argv))
  .version(false)

  // init command
  .command('init <trusted-root>', 'init cache', {
    'metadata-dir': { type: 'string' },
  }, (argv) => {
    if (!fs.existsSync(argv.metadataDir)) {
      fs.mkdirSync(argv.metadataDir, {
        recursive: true
      });
    }

    fs.copyFileSync(argv.trustedRoot, path.join(argv.metadataDir, 'root.json'));
  })

  // refresh command
  .command('refresh', 'refresh metadata from tuf repo', {
    'metadata-url': { type: 'string' },
    'metadata-dir': { type: 'string' },
  }, async (argv) => {
    const updater = new Updater({
      metadataBaseUrl: argv.metadataUrl,
      metadataDir: argv.metadataDir,
    })

    return updater.refresh()
  })

  // download command
  .command('download', 'retrieve target', {
    'metadata-url': { type: 'string' },
    'metadata-dir': { type: 'string' },
    'target-name': { type: 'string' },
    'target-base-url': { type: 'string' },
    'target-dir': { type: 'string' }
  }, async (argv) => {
    if (!fs.existsSync(argv.targetDir)) {
      fs.mkdirSync(argv.targetDir, {
        recursive: true
      });
    }

    const updater = new Updater({
      metadataBaseUrl: argv.metadataUrl,
      metadataDir: argv.metadataDir,
      targetBaseUrl: argv.targetBaseUrl,
      targetDir: argv.targetDir
    })

    const targetInfo = await updater.getTargetInfo(argv.targetName)
    if (!targetInfo) {
      throw new Error(`Target ${argv.targetPath} not found`);
    }

    return updater.downloadTarget(targetInfo)
  })
  .parse()
