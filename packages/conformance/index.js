#!/usr/bin/env node
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

yargs(hideBin(process.argv))
  .command('init [trusted-root]', 'initialize the local metadata cache', (yargs) => {
    return yargs
      .positional('trusted-root', {
        describe: 'initial trusted root metadata'
      })
  }, (argv) => {
    console.log(JSON.stringify(argv))
  })
  .command('refresh', 'update local metadata from the repository', (yargs) => {
    return yargs
      .options('metadata-url', {
        type: 'string',
        description: 'URL for the repository metadata store',
        demandOption: true,
      })
  }, (argv) => {
    console.log(JSON.stringify(argv))
  })
  .command('download', 'update local metadata from the repository', (yargs) => {
    return yargs
      .options('metadata-url', {
        type: 'string',
        description: 'URL for the repository metadata store',
        demandOption: true,
      })
      .options('target-path', {
        type: 'string',
        description: 'path to the target to be downloaded',
        demandOption: true,
      })
      .options('target-url', {
        type: 'string',
        description: 'URL for the repository target store',
        demandOption: true,
      })
      .options('target-dir', {
        type: 'string',
        description: 'path to directory for target storage',
        demandOption: true,
      })
  }, (argv) => {
    console.log(JSON.stringify(argv))
  })
  .option('metadata-dir', {
    type: 'string',
    description: 'path to directory for metadata storage',
    demandOption: true,
  })
  .parse()
