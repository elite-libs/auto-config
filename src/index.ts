import * as z from 'zod';
import minimist from 'minimist';
import { applyType, getPackageJson, isNestedObject } from './utils';
import { CommandOption, ConfigOptions } from './types';
import { isString } from 'lodash';
import { optionsHelp } from './render';

export const autoConfig = function <
  TInput extends { [K in keyof TInput]: CommandOption }
>(
  config: TInput,
  options: ConfigOptions = {
    caseSensitive: false,
  }
) {
  const commandOptions = getRawConfigObject(config, options);
  const schemaObject = verifySchema(config, commandOptions);

  return commandOptions;
};

function verifySchema<TInput extends { [K in keyof TInput]: CommandOption }>(
  config: TInput,
  commandOptions: Record<string, unknown>
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

  // verify schema
  const parseResults = schemaObject.safeParse(commandOptions);
  if (!parseResults.success) {
    throw new Error(
      `Config Error! Check your config, arguments and env vars! ${parseResults.error.toString()}`
    );
  }
  return schemaObject;
}

function getRawConfigObject<
  TInput extends { [K in keyof TInput]: CommandOption }
>(config: TInput, options: ConfigOptions) {
  let cliArgs = options._overrideArg || minimist(process.argv.slice(2));
  let envKeys = options._overrideEnv || process.env;

  if (!options.caseSensitive) {
    cliArgs = normalizeObjectKeys(cliArgs) as minimist.ParsedArgs;
    envKeys = normalizeObjectKeys(envKeys) as NodeJS.ProcessEnv;
    console.log('caseSensitive is false, keys are now lowercase', cliArgs, envKeys);
  }

  checkSpecialArgs(cliArgs, config, options);

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
  if (!opt.required) zType = zType.optional();

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
  let { keys, argKeys, envKeys } = commandOption;
  keys = Array.isArray(keys) ? keys : ([keys] as string[]);
  argKeys = Array.isArray(argKeys) ? argKeys : ([argKeys] as string[]);
  envKeys = Array.isArray(envKeys) ? envKeys : ([envKeys] as string[]);

  const argNameMatch = [...keys, ...argKeys].find(
    (key) => typeof key === 'string' && inputCliArgs[key]
  );
  const matchingArg = isString(argNameMatch) ? inputCliArgs[argNameMatch] : null;
  if (matchingArg) return applyType(matchingArg, commandOption.type);

  const envKeyMatch = [...keys, ...envKeys].find(
    (key) => typeof key === 'string' && inputEnvKeys[key]
  );
  const matchingEnv = isString(envKeyMatch) ? envKeys[envKeyMatch as any] : null;
  if (matchingEnv) return applyType(matchingEnv, commandOption.type);

  if (commandOption.default != null)
    return applyType(`${commandOption.default}`, commandOption.type);

  return null;
}
