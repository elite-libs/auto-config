import { promises as fs } from 'fs';
import path from 'path';
import isObject from 'lodash/isObject';
import keys from 'lodash/keys';
import type { OptionTypeConfig } from './types';

export function toBoolean(value: any) {
  value = value.toString().toLowerCase();
  return value === 'true' || value === 'yes' || value === 'y' || value === '1';
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
    case 'array':
      return value.split(',');
    // case 'object':
    //   return value as Record<string, unknown>;
    }
    return value;
}

export async function getPackageJson(currentDir: string = __dirname) {
  let packageRootPath = currentDir;
  while (/node_modules\//g.test(packageRootPath)) {
    packageRootPath = path.resolve(currentDir, '..');
  }
  console.error('packageRootPath', packageRootPath);
  const pkg = await (fs.readFile(`${packageRootPath}/package.json`, 'utf8').catch(console.error));
  return typeof pkg ==='string' ? JSON.parse(pkg) : null;
}

// function getFormattedZodError(error: ZodError) {
//   return `${error.message} at ${error.stack}\n\n` + error.errors.map(error => {
//     return `${error.path.join('.')}: ${error.message}.`;
//   }).join(' ');
// }

export function cleanupStringList(list: Array<string | undefined | null> | string[] | string | undefined | null, transformFn = (input: string) => input) {
  list = Array.isArray(list) ? list : [list];
  let processed = list.filter(v => v != null).map(item => transformFn(item!)) as string[];
  processed = [...new Set(processed)];
  return processed as string[];
}

export const lowerCase = (s: string) => s != null && s.toLowerCase() || '';

