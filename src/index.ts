import * as z from 'zod';
import minimist from 'minimist';
import { applyType, isNestedObject, toBoolean } from './utils';

export const xConfig = function (
  config: Record<string, CommandOption>,
  options: xConfigOptions = {
    normalizeCase: true,
  }
) {
  // Get raw config data based on input keys, env vars, and arguments
  const commandOptions = getRawConfigObject(options, config);
  const schemaObject = verifySchema(config, commandOptions);

  return commandOptions as z.infer<typeof schemaObject>;
};

function verifySchema(config: Record<string, CommandOption>, commandOptions: Record<string, unknown>) {
  type ConfigKeys = keyof typeof config;

  const schemaObject = z.object(
    Object.entries(config).reduce(
      (
        schema: Record<ConfigKeys, ReturnType<typeof getOptionSchema>>,
        [name, commandOption]
      ) => {
        schema[name] = getOptionSchema({ commandOption });
        return schema;
      },
      {}
    )
  );

  // verify schema
  const parseResults = schemaObject.safeParse(commandOptions);
  if (!parseResults.success) {
    throw new Error(
      `Config Error! Check your config, arguments and env vars! ${parseResults.error.toString()}`
    );
  }
  return schemaObject;
}

function getRawConfigObject(options: xConfigOptions, config: Record<string, CommandOption>) {
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
}

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

function getOptionSchema({ commandOption }: { commandOption: CommandOption }) {
  let zType =
    commandOption.type === 'array'
      ? z[commandOption.type](z.any())
      : z[commandOption.type]();
  if (commandOption.default != null) {
    // @ts-ignore
    zType = zType.default(commandOption.default);
  }
  if (!commandOption.required) {
    // @ts-ignore
    zType = zType.optional();
  }
  return zType;
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
  if (commandOption.default != null)
    return applyType(`${commandOption.default}`, commandOption.type);

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
  normalizeCase?: boolean;
  /** override for testing */
  _overrideEnv?: NodeJS.ProcessEnv;
  /** override for testing */
  _overrideArg?: minimist.ParsedArgs;
};

export type OptionTypeConfig =
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
  // | {
  //     type: 'bigint';
  //     default?: bigint;
  //     transform?: (input: unknown) => bigint;
  //     validate?: (input: bigint) => boolean;
  //   }
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
