import * as z from 'zod';
import minimist from 'minimist';
import {
  applyType,
  cleanupStringList,
  getPackageJson,
  isNestedObject,
  lowerCase,
} from './utils';
import { CommandOption, ConfigInputs, ConfigOptions } from './types';
import { isString } from 'lodash';
import { optionsHelp } from './render';
import ConfigError from './config-error';

export const autoConfig = function <
  TInput extends { [K in keyof TInput]: CommandOption }
>(
  config: TInput,
  options: ConfigOptions = {
    caseSensitive: false,
  }
) {
  let { cliArgs, envKeys } = extractEnvArgs(options);

  if (!options.caseSensitive) {
    // convert all keys properties to lowercase
    for (let key in config) {
      // @ts-ignore
      config[key] = normalizeConfigKeys(config[key], options);
    }
  }
  checkSpecialArgs(cliArgs, config, options);

  const schemaObject = buildSchema(config);
  const commandOptions = assembleConfigResults(config, { cliArgs, envKeys });
  // @ts-ignore
  const { data } = verifySchema(schemaObject, commandOptions, {
    cliArgs,
    envKeys,
  });

  return commandOptions;
};

function normalizeConfigKeys(config: CommandOption, options: ConfigOptions) {
  let { keys, flag, argKeys, envKeys } = config;
  config.keys = cleanupStringList(
    keys,
    !options.caseSensitive ? lowerCase : undefined
  );
  config.flag = cleanupStringList(flag);
  config.argKeys = cleanupStringList(
    argKeys,
    !options.caseSensitive ? lowerCase : undefined
  );
  config.envKeys = cleanupStringList(
    envKeys,
    !options.caseSensitive ? lowerCase : undefined
  );
  return config;
}

function buildSchema<TInput extends ReturnType<typeof assembleConfigResults>>(
  config: TInput
) {
  const schemaObject = z.object(
    Object.entries<CommandOption>(config).reduce(
      (schema, [name, commandOption]) => {
        // name as
        schema[name as keyof TInput] = getOptionSchema({ commandOption });
        return schema;
      },
      {} as { [K in keyof TInput]: ReturnType<typeof getOptionSchema> }
    )
  );
  return schemaObject;
}
function verifySchema<TInput>(
  schema: ReturnType<typeof buildSchema>,
  config: { [K in keyof TInput]: CommandOption },
  inputs: ConfigInputs
): Record<string, unknown> {
  // verify schema
  const parseResults = schema.safeParse(config);
  // console.log(config);
  if (!parseResults.success) {
    throw new ConfigError(
      `Config Error! Check your config, arguments and env vars! ${parseResults.error.toString()}`,
      inputs,
      parseResults.error
    );
  }
  return parseResults.data;
}

function assembleConfigResults<
  TInput extends { [K in keyof TInput]: CommandOption }
>(config: TInput, input: ConfigInputs) {
  const { cliArgs, envKeys } = input;

  type Keys = keyof TInput;

  const commandOptions = Object.entries<CommandOption>(config).reduce(
    (conf, [name, opt]) => {
      if (opt) {
        const v = getOptionValue({
          commandOption: opt,
          inputCliArgs: cliArgs,
          inputEnvKeys: envKeys,
        });
        if (opt.type === 'string') conf[name as Keys] = v as any;
        if (opt.type === 'number') conf[name as Keys] = v as any;
        if (opt.type === 'boolean') conf[name as Keys] = v as any;
        if (opt.type === 'array') conf[name as Keys] = v as any;
        if (opt.type === 'date') conf[name as Keys] = new Date(v as any) as any;
      }
      return conf;
    },
    {} as {
      [K in keyof TInput]?: TInput[K]['type'] extends 'string'
        ? string
        : TInput[K]['type'] extends 'number'
        ? number
        : TInput[K]['type'] extends 'boolean'
        ? boolean
        : any;
    }
  );
  return commandOptions;
}

function extractEnvArgs(options: ConfigOptions) {
  let cliArgs = options._overrideArg || minimist(process.argv.slice(2));
  let envKeys = options._overrideEnv || process.env;

  if (!options.caseSensitive) {
    cliArgs = normalizeObjectKeys(cliArgs) as minimist.ParsedArgs;
    envKeys = normalizeObjectKeys(envKeys) as NodeJS.ProcessEnv;
  }
  return { cliArgs, envKeys };
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

function checkSpecialArgs(
  args: minimist.ParsedArgs,
  config: { [K in string]: CommandOption },
  options: ConfigOptions
) {
  if (args.version) {
    console.log(
      getPackageJson(__dirname) ||
        `No package.json found from path ${__dirname}`
    );
    process.exit(0);
  }
  if (args.help) {
    console.log(
      `
  Usage:
    --help, -h: Show this help message
${optionsHelp(config, options)}`
    );
    process.exit(0);
  }
}

function getOptionSchema({
  commandOption: opt,
}: {
  commandOption: CommandOption;
}) {
  let zType = opt.type === 'array' ? z[opt.type](z.any()) : z[opt.type]();
  // @ts-ignore
  if (opt.default != null) zType = zType.default(opt.default);
  // @ts-ignore
  if (!opt.required && !('min' in opt)) zType = zType.optional();

  if ('min' in opt && 'min' in zType) zType = zType.min(opt.min!);
  if ('max' in opt && 'max' in zType) zType = zType.max(opt.min!);
  if ('gte' in opt && 'gte' in zType) zType = zType.gte(opt.min!);
  if ('lte' in opt && 'lte' in zType) zType = zType.lte(opt.min!);
  if ('gt' in opt && 'gt' in zType) zType = zType.gt(opt.min!);
  if ('lt' in opt && 'lt' in zType) zType = zType.lt(opt.min!);

  return zType;
}

function getOptionValue({
  commandOption,
  inputCliArgs,
  inputEnvKeys,
}: {
  commandOption: CommandOption;
  inputCliArgs: minimist.ParsedArgs;
  inputEnvKeys: NodeJS.ProcessEnv;
}) {
  let { keys, argKeys, envKeys, flag } = commandOption;
  keys = Array.isArray(keys) ? keys : ([keys] as string[]);
  flag = Array.isArray(flag) ? flag : ([flag] as string[]);
  argKeys = Array.isArray(argKeys) ? argKeys : ([argKeys] as string[]);
  envKeys = Array.isArray(envKeys) ? envKeys : ([envKeys] as string[]);

  const argNameMatch = [...keys, ...argKeys, ...flag].find(
    (key) => typeof key === 'string' && inputCliArgs[key]
  );
  const matchingArg = isString(argNameMatch)
    ? inputCliArgs[argNameMatch]
    : null;
  if (matchingArg) return applyType(matchingArg, commandOption.type);

  const envKeyMatch = [...keys, ...envKeys].find(
    (key) => typeof key === 'string' && inputEnvKeys[key]
  );
  const matchingEnv = isString(envKeyMatch)
    ? inputEnvKeys[envKeyMatch as any]
    : null;
  if (matchingEnv) return applyType(matchingEnv, commandOption.type);

  if (commandOption.default != null)
    return applyType(`${commandOption.default}`, commandOption.type);

  return null;
}
