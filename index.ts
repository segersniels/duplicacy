#!/usr/bin/env node

import fs from 'fs';
import which from 'which';
import Duplicacy from 'helpers/duplicacy';
import * as utils from 'helpers/utils';
import { program } from 'commander';
import packageJson from 'package';
import lockfile from 'lockfile';

const filename = `${__filename}.lock`;
const duplicacy = new Duplicacy();

program
  .name('backup')
  .version(packageJson.version)
  .option(
    '-r, --repository <path>',
    'Path to the duplicacy repository you wish to back up',
  )
  .option('-l, --log', 'Enable log-style output')
  .option(
    '--prune-days <number>',
    'Amount of days to keep backed up, snapshots falling outside the amount of days provided will be deleted',
  )
  .option('-t, --threads <number>', 'Number of uploading threads')
  .option('-s, --stats', 'Show statistics during and after backup')
  .option('--dry-run', "Dry run for testing, don't backup anything")
  .parse(process.argv);

/**
 * Lock the file for 5 minutes
 */
lockfile.lock(filename, { wait: 1000 * 60 * 5 }, (err) => {
  if (err) {
    utils.error(err.message);
  }

  /**
   * Do basic checks to see if we need to run at all
   */
  const path = which.sync('duplicacy', { nothrow: true });

  if (!path) {
    utils.error('Duplicacy is not installed');
  }

  if (!program.repository) {
    utils.error('No repository path provided to --repository flag');
  }

  /**
   * Create the post-backup script and make it executable
   */
  fs.mkdirSync(`${program.repository}/.duplicacy/scripts`, {
    recursive: true,
  });
  fs.writeFileSync(
    `${program.repository}/.duplicacy/scripts/post-backup`,
    `#!/bin/sh\n${path} prune -keep 0:${program.pruneDays ?? 1}`,
  );
  fs.chmodSync(`${program.repository}/.duplicacy/scripts/post-backup`, '755');

  duplicacy.backup(
    program.repository,
    {
      log: program.log ?? true,
      threads: program.threads ?? 2,
      stats: program.stats ?? true,
      ['dry-run']: program.dryRun ?? false,
    },
    () => {
      /**
       * Unlock the file after backup has been completed
       */
      lockfile.unlock(filename, (err) => {
        if (err) {
          utils.error(err.message);
        }
      });
    },
  );
});
