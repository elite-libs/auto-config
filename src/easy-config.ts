import mapValues from 'lodash.mapvalues';
import { getEnvAndArgs, stripDashesSlashes } from './utils';
import type { ConfigInputsRaw } from './types';

/**
 * ArgsList lists the arguments & env vars to read from.
 * 
 * To transform the value, add trailing callback function(s) to modify the value & type.
 *
 * ### Examples
 * 
 * - `['--port', (s) => s?.toString() || '']`
 * - `['PORT', parseInt]`
 * - `['--port', '-p', parseInt]`
 * - `['--devMode', '--dev', toBoolean]`
 * - `['PORT', Number]`
 *
 */
type ArgsList =
  | Readonly<[string, ...string[]]>
  | Readonly<[...string[], Function]>;

type Tail<T extends any[] | Readonly<any[]>> = T extends [
  head: any,
  ...tail: infer __Tail
]
  ? __Tail
  : unknown;
type ReturnType<T, TFallback = unknown> = T extends (...args: any[]) => infer R
  ? R
  : TFallback;

export function easyConfig<TConfig extends { [K in keyof TConfig]: ArgsList }>(
  config: TConfig,
  { cliArgs = process.argv, envKeys = process.env }: ConfigInputsRaw = {}
): {
  [K in keyof TConfig]: ReturnType<Tail<TConfig[K]>, string>;
} {
  const { cliArgs: cliParams, envKeys: envParams } = getEnvAndArgs({
    cliArgs,
    envKeys,
  });
  return mapValues(config, (argsList, key) => {
    let currentValue = undefined;
    for (let arg of argsList) {
      if (typeof arg === 'function' && currentValue !== undefined) {
        currentValue = arg(currentValue);
      } else if (typeof arg === 'string') {
        // Skip if currentValue is defined.
        if (currentValue !== undefined) continue;
        if (cliParams?.[stripDashesSlashes(arg)])
          currentValue = cliParams?.[stripDashesSlashes(arg)];
        if (envParams?.[arg]) currentValue = envParams?.[arg];
      }
    }
    return currentValue;
  });
}
