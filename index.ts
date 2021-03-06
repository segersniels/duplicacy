#!/usr/bin/env node

import fs from 'fs';
import which from 'which';
import Duplicacy from 'helpers/duplicacy';
import * as utils from 'helpers/utils';
import { program } from 'commander';
import packageJson from 'package';
import lockfile from 'lockfile';
import Debug from 'helpers/debug';

program
  .name('backup')
  .version(packageJson.version)
  .option(
    '-r, --repository <path>',
    'Path to the duplicacy repository you wish to back up',
  )
  .option('-l, --log', 'Enable log-style output', true)
  .option(
    '--prune-days <number>',
    'Amount of days to keep backed up, snapshots falling outside the amount of days provided will be deleted',
  )
  .option('-t, --threads <number>', 'Number of uploading threads')
  .option('-s, --stats', 'Show statistics during and after backup', true)
  .option('--dry-run', "Dry run for testing, don't backup anything", false)
  .option('--wait <minutes>', 'Time in minutes to wait on lock to go away')
  .option(
    '--bin <path>',
    'If needed you can point to your duplicacy binary manually',
  )
  .option('--debug', 'Enable to output basic debugging statements')
  .option('--status', 'View the prune logs of the last run')
  .option('--list', 'List snapshots')
  .parse(process.argv);

(() => {
  if (!program.repository) {
    utils.error('No repository path provided to --repository flag');
  }

  const debug = new Debug(program.debug);

  const path =
    which.sync('duplicacy', { nothrow: true }) ??
    program.bin ??
    '/usr/local/bin/duplicacy';
  const duplicacy = new Duplicacy(path, debug);

  if (program.status) {
    return duplicacy.status(program.repository);
  }

  debug.log(`Path of duplicacy binary determined as: ${path}`);

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

  debug.log(
    `Successfully created post-backup script at: ${program.repository}/.duplicacy/scripts/post-backup`,
  );

  if (program.list) {
    return duplicacy.list(program.repository);
  }

  /**
   * Lock the file for 5 minutes
   */
  lockfile.lock(
    `${program.repository}/.duplicacy/.lock`,
    { wait: 1000 * 60 * (program.wait ?? 5) },
    (err) => {
      if (err) {
        utils.error(err.message);
      }

      debug.log('Successfully acquired lock on lockfile');

      duplicacy.backup(
        program.repository,
        {
          log: program.log,
          threads: program.threads ?? 2,
          stats: program.stats,
          ['dry-run']: program.dryRun,
        },
        () => {
          /**
           * Unlock the file after backup has been completed
           */
          lockfile.unlock(`${program.repository}/.duplicacy/.lock`, (err) => {
            if (err) {
              utils.error(err.message);
            }

            debug.log('Successfully removed lock on lockfile');
          });
        },
      );
    },
  );
})();
