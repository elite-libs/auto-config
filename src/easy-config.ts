import mapValues from "lodash.mapvalues";
import { getEnvAndArgs, stripDashesSlashes } from "./utils";
import type { ConfigInputsRaw } from "./types";

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

type Tail<T extends any[]> = T extends [head: any, ...tail: infer Tail_]
  ? Tail_
  : never;

type Last<T> = T extends { "0": infer Item }
  ? Item
  : T extends [item: any, ...rest: infer Rest]
  ? Last<Rest>
  : string;

type TailCallback<TReturnType> = (value?: string) => TReturnType;
type ArgsListCallbackFirst<TReturnType> = [TailCallback<TReturnType>, ...string[]] | [string, ...string[]];
type ArgsListCallback<TReturnType> = [...string[], TailCallback<TReturnType>] | [string, ...string[]];
type ArgsList = [...string[], (...args: any) => any] | [string, ...string[]];

// type Tail<T extends any[] | any[]> = T extends [
//   head: any,
//   ...tail: infer __Last
// ]
//   ? __Last
//   : unknown;
// type ReturnType<T, TFallback = unknown> = T extends (...args: any[]) => infer R
//   ? R
//   : TFallback;

type Head<T extends any[]> = T extends [] ? never : T[0];

export type EasyConfigResults<
  TConfig extends { [K in keyof TConfig]: ArgsList }
> = {
  [K in keyof TConfig]: Tail<TConfig[K]> extends (...args: any) => infer R
    ? Tail<TConfig[K]>
    : string;
};

export type EasyConfigResultsFn<
  TConfig extends { [K in keyof TConfig]: ArgsList }
> = {
  [K in keyof TConfig]: Head<TConfig[K]> extends (...args: any) => infer R
    ? R
    : string;
};


export function easyConfig<TConfig extends { [K in keyof TConfig]: ArgsList }>(
  config: TConfig,
  { cliArgs = process.argv, envKeys = process.env }: ConfigInputsRaw = {}
) {
  const { cliArgs: cliParams, envKeys: envParams } = getEnvAndArgs({
    cliArgs,
    envKeys,
  });
  // type ConfigReturnType<TArgs extends ArgsList> = Last<TArgs> extends (value: string) => unknown
  //   ? ReturnType<Last<TArgs>>
  //   : string;

  // function loadArgsApplyCallback<TReturnType>(    argsList: ArgsListCallback<TReturnType>,  ): TReturnType {
  function loadArgsApplyCallback(argsList: ArgsList) {
    let currentValue: undefined | string | number | boolean | Date = undefined;

    for (let arg of argsList) {
      if (currentValue != undefined && typeof arg === "string") {
        // already found a match, skip to next arg in case we find a function
        continue;
      }
      if (typeof arg === "string") {
        arg = stripDashesSlashes(arg);
        currentValue = cliParams?.[stripDashesSlashes(arg)] ?? envParams?.[arg];
      }
      if (typeof arg === 'function') {
        currentValue = arg(currentValue);
        break;
      }
    }
    if (typeof currentValue === 'bigint') return currentValue as bigint;
    if (typeof currentValue === 'boolean') return currentValue as boolean;
    if (typeof currentValue === 'function') return currentValue as (...args: any[]) => any;
    if (typeof currentValue === 'number') return currentValue as number;
    if (typeof currentValue === 'object') return currentValue as object;
    if (typeof currentValue === 'string') return currentValue as string;
    if (typeof currentValue === 'symbol') return currentValue as symbol;
    if (typeof currentValue === 'undefined') return currentValue as undefined;
    return currentValue as any;

  }
  return Object.entries<ArgsList>(config).reduce((results, field) => {
    const [name, argsList] = field;
    results[name as keyof TConfig] = loadArgsApplyCallback(argsList);
    return results;
    // return currentValue as Last<typeof argsList> extends (value: string) => unknown ? ReturnType<Last<typeof argsList>, string> : string;
  }, {} as EasyConfigResults<TConfig>)!;
}
