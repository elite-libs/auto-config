import debug from 'debug';

export const setEnvKey = (key: string, value: string) => {
  let previous = process.env[key];
  const resetEnvKey = () => {
    if (previous == undefined) {
      delete process.env[key];
    } else {
      process.env[key] = previous;
    }
    return previous;
  };
  process.env[key] = value;
  return resetEnvKey;
};

const debugLog = debug('auto-config:mockArgv');

export const mockArgv = (argv: string[]) => {
  let previousArgv: string[] | null = null;
  debugLog('argv:process', process.argv);
  previousArgv = process.argv.concat();
  process.argv = process.argv.slice(0, 2).concat(argv);
  debugLog('argv:mock', process.argv);
  const restoreArgv = () => {
    debugLog('argv:process', process.argv);
    debugLog('argv:restore', previousArgv);
    if (previousArgv) {
      process.argv = previousArgv!;
      previousArgv = null;
      return true;
    }
  };
  return restoreArgv;
};

