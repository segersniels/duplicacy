import lockfile from 'proper-lockfile';

export default class Lockfile {
  _filename: string;

  constructor(filename: string) {
    this._filename = filename;
  }

  private lock = async () => {
    try {
      return await lockfile.lock(this._filename);
    } catch (err) {
      console.warn(`[WARN] ${err.message}`);
      process.exit();
    }
  };

  private unlock = async () => {
    if (!(await lockfile.check(this._filename))) {
      return;
    }

    await lockfile.unlock(this._filename);
  };

  public run = async (fn: () => Promise<void>) => {
    await this.lock();
    await fn();
    await this.unlock();
  };
}
