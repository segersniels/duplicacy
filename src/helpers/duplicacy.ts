import { spawn } from 'child_process';

const GLOBAL_OPTIONS = ['log'];

interface Options {
  log?: boolean;
  threads?: number;
  stats?: boolean;
  ['dry-run']?: boolean;
}

export default class Duplicacy {
  _path: string | null;

  constructor(path: string) {
    this._path = path;
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

      flags.push(`-${key}`);

      // Only add the value when not a boolean flag
      if (typeof value === 'boolean') {
        continue;
      }

      flags.push(`${value}`);
    }

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
    const ls = spawn(this._path, [...global, 'backup', ...flags], {
      cwd: repository,
    });

    ls.stdout.on('data', function (data) {
      console.log(data.toString());
    });

    ls.on('close', fn);
  };
}
