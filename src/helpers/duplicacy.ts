import { spawn } from 'child_process';
import Debug from 'helpers/debug';
import fs from 'fs';

const GLOBAL_OPTIONS = ['log'];

interface Options {
  log?: boolean;
  threads?: number;
  stats?: boolean;
  ['dry-run']?: boolean;
}

export default class Duplicacy {
  _path: string | null;
  _debug: Debug;

  constructor(path: string, debug: Debug) {
    this._path = path;
    this._debug = debug;
  }

  private getFlagsFromOptions = (options: Options) => {
    const flags: string[] = [],
      global: string[] = [];

    for (const [key, value] of Object.entries(options)) {
      // Global options need to go infront of the actual command for some dumb reason...
      if (GLOBAL_OPTIONS.includes(key)) {
        global.push(`-${key}`);
        continue;
      }

      // Don't append boolean flags that are set to false
      if (!value) {
        continue;
      }

      flags.push(`-${key}`);

      // Only add the value when not a boolean flag
      if (typeof value === 'boolean') {
        continue;
      }

      flags.push(`${value}`);
    }

    this._debug.log(
      `Extracted flags from config: ${JSON.stringify({ flags, global })}`,
    );

    return {
      flags,
      global,
    };
  };

  public backup = (
    repository: string,
    options: Options = {},
    fn: () => void,
  ) => {
    if (!this._path) {
      console.error('[ERROR] Duplicacy is not installed');
      process.exit();
    }

    const { global, flags } = this.getFlagsFromOptions(options);

    this._debug.log(
      `Spawning command in working directory ${repository}: ${this._path} ${[
        ...global,
        'backup',
        ...flags,
      ].join(' ')}`,
    );

    const ls = spawn(this._path, [...global, 'backup', ...flags], {
      cwd: repository,
    });

    ls.stdout.on('data', function (data) {
      console.log(data.toString());
    });

    ls.on('close', fn);
  };

  public status = (repository: string) => {
    const dir = `${repository}/.duplicacy/logs`;
    const file = fs
      .readdirSync(dir)
      .filter((file) => fs.lstatSync(`${dir}/${file}`).isFile())
      .map((file) => ({
        file: `${dir}/${file}`,
        mtime: fs.lstatSync(`${dir}/${file}`).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())?.[0].file;
    const output = fs.readFileSync(file).toString();

    console.log(output);
  };
}
