// import { ZodSchema } from 'zod';
import minimist from 'minimist';
import { isObject, keys } from 'lodash';

export const xConfig = function (
  config: Record<string, CommandOption>,
  options: xConfigOptions = {}
) {
  let cliArgs = options._overrideArg || minimist(process.argv.slice(2));
  let envKeys = options._overrideEnv || process.env;

  if (options.normalizeCase) {
    cliArgs = normalizeObjectKeys(cliArgs) as minimist.ParsedArgs;
    envKeys = normalizeObjectKeys(envKeys) as NodeJS.ProcessEnv;
  }

  const commandOptions = Object.entries(config).reduce(
    (results: Record<string, unknown>, [name, commandOption]) => {
      results[name] = getOptionValue({ commandOption, cliArgs, envKeys });
      return results;
    },
    {}
  );

  return commandOptions;
};

function normalizeObjectKeys<TInput>(
  obj: TInput extends object ? TInput : never
) {
  return Object.entries(obj).reduce(
    (results: Record<string, unknown>, [key, value]) => {
      results[key.toLowerCase()] = isNestedObject(value)
        ? normalizeObjectKeys(value)
        : value;
      return results;
    },
    {}
  );
}

function applyType(value: string, type: OptionTypeConfig['type']) {
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

function toBoolean(value: any) {
  value = value.toString().toLowerCase();
  return value === 'true' || value === 'yes' || value === 'y' || value === '1';
}

function isNestedObject(obj: unknown) {
  return isObject(obj) && !Array.isArray(obj) && keys(obj).length > 0;
}

function getOptionValue({
  commandOption,
  cliArgs,
  envKeys,
}: {
  commandOption: CommandOption;
  cliArgs: minimist.ParsedArgs;
  envKeys: NodeJS.ProcessEnv;
}) {
  let { keys, argumentNames, environmentKeys } = commandOption;
  keys = Array.isArray(keys) ? keys : ([keys] as string[]);
  argumentNames = Array.isArray(argumentNames)
    ? argumentNames
    : ([argumentNames] as string[]);
  environmentKeys = Array.isArray(environmentKeys)
    ? environmentKeys
    : ([environmentKeys] as string[]);

  // note: Check Arg Names
  const matchingArgName = [...keys, ...argumentNames].find(
    (key) => typeof key === 'string' && cliArgs[key]
  );
  const matchingArg =
    typeof matchingArgName === 'string' ? cliArgs[matchingArgName] : null;
  if (matchingArg) return applyType(matchingArg, commandOption.type);

  // note: Check Env Keys
  const matchingEnvKey = [...keys, environmentKeys].find(
    (key) => typeof key === 'string' && envKeys[key]
  );
  const matchingEnv =
    typeof matchingEnvKey === 'string' ? envKeys[matchingEnvKey] : null;
  if (matchingEnv) return applyType(matchingEnv, commandOption.type);

  // note: Check Default
  if (commandOption.default != null) return applyType(`${commandOption.default}`, commandOption.type);

  return undefined;
}

export type CommandOption = OptionTypeConfig & {
  doc?: string;
  keys?: string | string[];
  environmentKeys?: string | string[];
  argumentNames?: string | string[];
  required?: boolean;
};

export type xConfigOptions = {
  /** override for testing */
  _overrideEnv?: NodeJS.ProcessEnv;
  /** override for testing */
  _overrideArg?: minimist.ParsedArgs;
  normalizeCase?: boolean;
};

type NamedCommandOption = CommandOption & {
  name: string;
};

type OptionTypeConfig =
  | {
      type: 'string';
      default?: string;
      transform?: (input: unknown) => string;
      validate?: (input: string) => boolean;
    }
  | {
      type: 'number';
      default?: number;
      transform?: (input: unknown) => number;
      validate?: (input: number) => boolean;
    }
  | {
      type: 'bigint';
      default?: bigint;
      transform?: (input: unknown) => bigint;
      validate?: (input: bigint) => boolean;
    }
  | {
      type: 'date';
      default?: Date;
      transform?: (input: unknown) => Date;
      validate?: (input: Date) => boolean;
    }
  | {
      type: 'boolean';
      default?: boolean;
      transform?: (input: unknown) => boolean;
      validate?: (input: boolean) => boolean;
    }
  | {
      type: 'array';
      default?: any[];
      transform?: (input: unknown) => any[];
      validate?: (input: any[]) => boolean;
    };
