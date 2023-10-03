import { Command, Flags } from '@oclif/core';
import fs from 'fs';
import fetch from 'make-fetch-happen';
import os from 'os';
import path from 'path';
import { Updater } from 'tuf-js';

export default class DownloadTarget extends Command {
  static override aliases = ['download'];
  static override description =
    'download a target from a TUF repository and verify its signature';
  static override examples = ['<%= config.bin %> <%= command.id %>'];

  static override flags = {
    'cache-path': Flags.string({
      description: 'path to the Sigstore TUF cache',
      required: false,
    }),
    'metadata-base-url': Flags.string({
      description: 'URL to the TUF metadata repository',
      required: true,
    }),
    'target-base-url': Flags.string({
      description: 'URL to the TUF target repository',
      required: false,
    }),
    'target-name': Flags.string({
      description: 'name of the target to download',
      required: true,
    }),
    root: Flags.file({
      description: 'path to the initial trusted root',
      exactlyOne: ['unsafe-root-download'],
    }),
    'unsafe-root-download': Flags.boolean({
      description:
        'allow downloading the trusted root from the TUF metadata repository (THIS IS NOT SAFE)',
      default: false,
      allowNo: false,
      exactlyOne: ['root'],
    }),
    'output-file': Flags.string({
      char: 'o',
      description: 'write output to file',
      required: false,
      aliases: ['output', 'out'],
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(DownloadTarget);

    let metadataPath = flags['cache-path'];

    // If no cache path is specified, create a temporary directory.
    if (!metadataPath) {
      const tmpDir = fs.realpathSync(os.tmpdir());
      metadataPath = fs.mkdtempSync(tmpDir + path.sep);
    }

    const targetPath = path.join(metadataPath, 'targets');

    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    if (flags.root) {
      fs.copyFileSync(flags.root, path.join(metadataPath, 'root.json'));
    }

    if (flags['unsafe-root-download']) {
      const rootUrl = flags['metadata-base-url'] + '/1.root.json';
      const rootJSON = await fetch(rootUrl).then((res) => res.json());
      fs.writeFileSync(
        path.join(metadataPath, 'root.json'),
        JSON.stringify(rootJSON, null, 2)
      );
    }

    if (!fs.existsSync(path.join(metadataPath, 'root.json'))) {
      throw new Error(
        'No root.json found in the cache path. Please specify a root.json file or allow downloading the root.json from the TUF metadata repository.'
      );
    }

    const metadataBaseUrl = flags['metadata-base-url'];
    const targetBaseUrl =
      flags['target-base-url'] || `${metadataBaseUrl}/targets`;
    const updater = new Updater({
      metadataBaseUrl,
      targetBaseUrl,
      metadataDir: metadataPath,
      targetDir: targetPath,
    });
    await updater.refresh();

    const targetInfo = await updater.getTargetInfo(flags['target-name']);
    if (!targetInfo) {
      throw new Error(`Target ${flags['target-name']} not found`);
    }

    const targetContent = await updater
      .downloadTarget(targetInfo)
      .then((path) => fs.readFileSync(path, 'utf-8'));

    if (flags['output-file']) {
      fs.writeFileSync(flags['output-file'], targetContent);
    } else {
      this.log(targetContent);
    }

    // If no cache path was specified, delete the temporary directory.
    if (!flags['cache-path']) {
      fs.rmSync(metadataPath, { force: true, recursive: true });
    }
  }
}
