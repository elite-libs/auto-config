import debug from 'debug';
import isObject from 'lodash.isobject';
import minimist from 'minimist';
import { isAbsolute } from 'path';
import type {
  ConfigInputsParsed,
  ConfigInputsRaw,
  OptionTypeConfig,
} from './types';

const debugLog = debug('auto-config:utils');

export function toBoolean(value: any) {
  value = value.toString().toLowerCase();
  return (
    value === 'true' ||
    value === 't' ||
    value === 'yes' ||
    value === 'y' ||
    value === '1' ||
    value === 'on'
  );
}
// export function isNestedObject(obj: unknown) {
//   return isObject(obj) && !Array.isArray(obj) && keys(obj).length > 0;
// }

export function applyType(
  value: string,
  type: OptionTypeConfig['type'] = 'string'
) {
  switch (type) {
    case 'string':
      return value;
    case 'number':
      return parseInt(value);
    case 'boolean':
      return toBoolean(value);
    case 'date':
      return new Date(value);
    case 'array':
      return value.split(',');
    case 'enum':
      return value;
    // case 'object':
    //   return value as Record<string, unknown>;
  }
  // return value;
}

export function cleanupStringList(
  list: Array<string | undefined | null> | string[] | string | undefined | null
) {
  list = isObject(list) && Array.isArray(list) ? list : [list];
  let processed = list.filter((v) => v != null);
  processed = [...new Set(processed)];
  return processed as string[];
}

export const stripDashes = (str: string = '') => str.replace(/^-+/gi, '');
export const stripDashesSlashes = (str: string = '') =>
  str.replace(/^[-\/]+/g, '');

export function getEnvAndArgs({
  cliArgs = process.argv,
  envKeys = process.env,
}: ConfigInputsRaw = {}): ConfigInputsParsed {
  debugLog('extractEnvArgs.cliArgs', cliArgs);
  debugLog('extractEnvArgs.envKeys', envKeys);

  let cliParsed: ReturnType<typeof minimist> | undefined = undefined;

  if (cliArgs != null) {
    // This should exclude the first 2 parts of argv, typically the ...
    //   path to node & the .js file we're executing.
    cliArgs = process.argv.filter((arg, i) => !(i < 2 && isAbsolute(arg)));
    cliParsed = minimist(cliArgs);
  }

  return { cliArgs: cliParsed, envKeys };
}
