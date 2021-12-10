import * as z from 'zod';
import minimist from 'minimist';
import { applyType, isNestedObject } from './utils';
import { CommandOption, xConfigOptions } from './types';
import { isString } from 'lodash';

export const xConfig = function (
  config: Record<string, CommandOption>,
  options: xConfigOptions = {
    caseSensitive: true,
  }
) {
  const commandOptions = getRawConfigObject(options, config);
  const schemaObject = verifySchema(config, commandOptions);

  return commandOptions as z.infer<typeof schemaObject>;
};

function verifySchema(
  config: Record<string, CommandOption>,
  commandOptions: Record<string, unknown>
) {
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

function getRawConfigObject(
  options: xConfigOptions,
  config: Record<string, CommandOption>
) {
  let cliArgs = options._overrideArg || minimist(process.argv.slice(2));
  let envKeys = options._overrideEnv || process.env;

  if (!options.caseSensitive) {
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

  const argNameMatch = [...keys, ...argumentNames].find(
    (key) => typeof key === 'string' && cliArgs[key]
  );
  const matchingArg = isString(argNameMatch) ? cliArgs[argNameMatch] : null;
  if (matchingArg) return applyType(matchingArg, commandOption.type);

  const envKeyMatch = [...keys, environmentKeys].find(
    (key) => typeof key === 'string' && envKeys[key]
  );
  const matchingEnv = isString(envKeyMatch) ? envKeys[envKeyMatch] : null;
  if (matchingEnv) return applyType(matchingEnv, commandOption.type);

  if (commandOption.default != null)
    return applyType(`${commandOption.default}`, commandOption.type);

  return undefined;
}
