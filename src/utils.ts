import isObject from 'lodash.isobject';
import keys from 'lodash.keys';
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
// export function isNestedObject(obj: unknown) {
//   return isObject(obj) && !Array.isArray(obj) && keys(obj).length > 0;
// }

export function applyType(value: string, type: OptionTypeConfig['type'] = 'string') {
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

export const termMarkup = {
  // https://github.com/cronvel/terminal-kit/blob/master/doc/markup.md
  italic: (str: string) => `^/${str}^`,
  dim: (str: string) => `^-${str}^`,
  bold: (str: string) => `^+${str}^`,
  reset: () => `^:`,
};

export const stripDashes = (str: string = '') => str.replace(/^-+/mig, '');
