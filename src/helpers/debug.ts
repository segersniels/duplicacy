export default class Debug {
  _shouldLog: boolean;

  constructor(shouldLog = false) {
    this._shouldLog = shouldLog;
  }

  public log = (message: string) => {
    if (!this._shouldLog) {
      return;
    }

    console.log(`[DEBUG] ${message}`);
  };
}
