import fs from 'fs';
import path from 'path';
import isObject from 'lodash.isobject';
import keys from 'lodash.keys';
import debug from 'debug';
import type { OptionTypeConfig } from './types';

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
export function isNestedObject(obj: unknown) {
  return isObject(obj) && !Array.isArray(obj) && keys(obj).length > 0;
}

export function applyType(value: string, type: OptionTypeConfig['type']) {
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
    // case 'object':
    //   return value as Record<string, unknown>;
  }
  return value;
}

export function getPackageJson(currentDir: string = process.cwd()) {
  let packageRootPath = process.cwd();
  while (/node_modules\//g.test(packageRootPath)) {
    packageRootPath = path.resolve(currentDir, '..');
  }
  try {
    const pkg = fs.readFileSync(`${packageRootPath}/package.json`, 'utf8');
    return typeof pkg === 'string' ? JSON.parse(pkg) : null;
  } catch (error) {
    return null;
  }
}

export function cleanupStringList(
  list: Array<string | undefined | null> | string[] | string | undefined | null
) {
  list = isObject(list) && Array.isArray(list) ? list : [list];
  let processed = list.filter((v) => v != null);
  processed = [...new Set(processed)];
  return processed as string[];
}

export const termMarkup = {
  // https://github.com/cronvel/terminal-kit/blob/master/doc/markup.md
  italic: (str: string) => `^/${str}^`,
  dim: (str: string) => `^-${str}^`,
  bold: (str: string) => `^+${str}^`,
  reset: () => `^:`,
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

export const stripDashes = (str: string = '') => str.replace(/^-+/mig, '');
