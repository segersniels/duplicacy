#!/usr/bin/env node

import fs from 'fs';
import Lockfile from 'helpers/lockfile';
import which from 'which';
import Duplicacy from 'helpers/duplicacy';

const lockfile = new Lockfile(__filename);
const duplicacy = new Duplicacy();
const repository = process.argv[2];

const error = (message: string) => {
  console.error(`[ERROR] ${message}`);
  process.exit();
};

lockfile.run(async () => {
  if (!repository) {
    error('No repository path provided as first argument');
  }

  const path = which.sync('duplicacy', { nothrow: true });

  if (!path) {
    error('Duplicacy is not installed');
  }

  /**
   * Create the post-backup script and make it executable
   */
  await fs.promises.mkdir(`${repository}/.duplicacy/scripts`, {
    recursive: true,
  });
  await fs.promises.writeFile(
    `${repository}/.duplicacy/scripts/post-backup`,
    `#!/bin/sh\n${path} prune -keep 0:1`,
  );
  await fs.promises.chmod(
    `${repository}/.duplicacy/scripts/post-backup`,
    '755',
  );

  await duplicacy.backup(repository, {
    log: true,
    threads: 2,
    stats: true,
  });
});
