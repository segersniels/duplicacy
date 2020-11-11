# Duplicacy

Very barebones backup tool using `duplicacy` to easily be used within a cron job. Besides backing up from wherever your current working directory is, it also creates a `post-backup` script under the repository to remove backups after `n` amount of days (default 1 day).

## Installation

Grab the latest binary release from [here](https://github.com/segersniels/duplicacy/releases).

## Usage

```
Usage: backup [options]

Options:
  -V, --version            output the version number
  -r, --repository <path>  Path to the duplicacy repository you wish to back up
  -l, --log                Enable log-style output
  --prune-days <number>    Amount of days to keep backed up, snapshots falling outside the amount of days provided will be deleted
  -t, --threads <number>   Number of uploading threads
  -s, --stats              Show statistics during and after backup
  --dry-run                Dry run for testing, don't backup anything
  --wait <minutes>         Time in minutes to wait on lock to go away
  -h, --help               display help for command
```

And use it in a cronjob like such (note that the duplicacy binary is named `backup` and is located in `/usr/local/bin`):

```bash
0 3 * * * /usr/local/bin/backup --repository /lorem/ipsum >/var/log/ipsum.log
0 4 * * * /usr/local/bin/backup --repository /foo/bar >/var/log/bar.log
```

## Lock

I've read mixed things about running multiple `duplicacy backup`'s at the same time causing performance or weird issues so I decided to place a lock on the binary until the backup completes.

This means that you can't run two parallel instances of a backup at the same time. When a lock is placed on the binary the second execution will wait on the first execution to complete before starting. This ensures your cron jobs don't interfere with each other when one takes longer than usual. The default wait time is 5 minutes so system resources don't get put aside for too long.

## Note

#### `--log`

Default `true`.

#### `--stats`

Default `true`.

#### `--threads`

Default set to `2` threads.

#### `--prune-days`

Default set to `1` day.
