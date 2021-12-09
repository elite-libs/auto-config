import isObject from 'lodash/isObject';
import keys from 'lodash/keys';
import type { OptionTypeConfig } from './';

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
    default:
      return value;
  }
}
