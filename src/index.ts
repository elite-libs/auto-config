import * as z from 'zod';
import minimist from 'minimist';
import { applyType, isNestedObject } from './utils';
import {
  CommandOption,
  ConfigResults,
  ExtractOptionType,
  xConfigOptions,
} from './types';
import { isString } from 'lodash';
import { reduce } from 'lodash';
import {
  ZodNumber,
  ZodNumberDef,
  ZodString,
  ZodStringDef,
  ZodType,
  ZodTypeDef,
} from 'zod';

export const xConfig = function <
  TInput extends { [K in keyof TInput]: CommandOption }
>(
  config: TInput,
  options: xConfigOptions = {
    caseSensitive: true,
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
>(config: TInput, options: xConfigOptions) {
  let cliArgs = options._overrideArg || minimist(process.argv.slice(2));
  let envKeys = options._overrideEnv || process.env;

  if (!options.caseSensitive) {
    cliArgs = normalizeObjectKeys(cliArgs) as minimist.ParsedArgs;
    envKeys = normalizeObjectKeys(envKeys) as NodeJS.ProcessEnv;
  }

  type Keys = keyof TInput;

  const commandOptions = Object.entries<CommandOption>(config).reduce(
    (conf, [name, opt]) => {
      if (opt) {
        const v = getOptionValue({ commandOption: opt, cliArgs, envKeys });
        if (opt.type === 'string') conf[name as Keys] = (v as any);
        if (opt.type === 'number') conf[name as Keys] = (v as any);
        if (opt.type === 'boolean') conf[name as Keys] = (v as any);
        if (opt.type === 'array') conf[name as Keys] = (v as any);
        if (opt.type === 'date') conf[name as Keys] = new Date((v as any)) as any;
      }
      return conf;
    },
    {} as {
      [K in keyof TInput]?: TInput[K]['type'] extends 'string' ? string :
      TInput[K]['type'] extends 'number' ? number :
      TInput[K]['type'] extends 'boolean' ? boolean : any;
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

  return null;
}
