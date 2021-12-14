import * as z from "zod";
import minimist from "minimist";
import {
  applyType,
  cleanupStringList,
  getPackageJson,
  isNestedObject,
  lowerCase,
} from "./utils";
import { CommandOption, ConfigInputs, ConfigOptions, ConfigResults, GetTypeByTypeString, Nullable } from "./types";
import isString from "lodash.isstring";
import { optionsHelp } from "./render";
import debug from "debug";

export const autoConfig = function <
  TInput extends { [K in keyof TInput]: CommandOption }
>(
  config: TInput,
  options: ConfigOptions = {
    caseSensitive: false,
  }
) {
  const debugLog = debug("auto-config");
  debugLog("Loading runtime environment & command line arguments...");
  let { cliArgs, envKeys, originalArgs } = extractEnvArgs(options);
  debugLog("runtime.cliArgs", cliArgs);
  debugLog("runtime.envKeys", envKeys);
  debugLog("config.keys", Object.keys(config).sort().join(", "));

  if (!options.caseSensitive) {
    // convert all keys properties to lowercase
    for (let key in config) {
      // @ts-ignore
      config[key] = normalizeConfigKeys(config[key], options);
    }
  }
  checkSpecialArgs(cliArgs, config, options);

  const schemaObject = buildSchema(config);
  debugLog('schemaObject', schemaObject);

  const commandOptions = assembleConfigResults(config, { cliArgs, envKeys, originalArgs });
  
  const results = verifySchema(schemaObject, commandOptions, {
    cliArgs,
    envKeys,
    originalArgs,
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

function buildSchema<TInput extends { [K in keyof TInput]: CommandOption }>(
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
function verifySchema<TInput extends { [K in keyof TInput]: CommandOption }>(
  schema: ReturnType<typeof buildSchema>,
  config: ConfigResults<TInput>,
  inputs: ConfigInputs
): Record<string, unknown> {
  const debugLog = debug("auto-config:verifySchema");
  // verify schema
  const parseResults = schema.safeParse(config);
  debugLog("parse success?", parseResults.success);
  if (!parseResults.success) {
    debugLog("parse success?", parseResults.success);
  const fieldList = parseResults.error.issues.map((issue) => {
      return `${issue.path.join(".")} - (${issue.message})`;
    });
    console.error(`Config is Invalid or Missing for ${fieldList.length} field(s): ${fieldList.join("; ")}`);
    return process.exit(1);
    // throw new ConfigError(
    //   `Config Error! Invalid or Missing values for: ${fieldList.join("; ")}!`,
    //   inputs,
    //   parseResults.error
    // );
  }
  return parseResults.data;
}

function assembleConfigResults<
  TInput extends { [K in keyof TInput]: CommandOption }
>(config: TInput, input: ConfigInputs) {
  const { cliArgs, envKeys, originalArgs } = input;

  type Keys = keyof TInput;

  const commandOptions = Object.entries<CommandOption>(config).reduce(
    (conf, [name, opt]) => {
      if (opt) {
        const v = getOptionValue({
          commandOption: opt,
          inputCliArgs: cliArgs,
          inputEnvKeys: envKeys,
          inputOriginalArgs: originalArgs,
        });
        if (opt.type === "string") conf[name as Keys] = v as any;
        if (opt.type === "number") conf[name as Keys] = v as any;
        if (opt.type === "boolean") conf[name as Keys] = v as any;
        if (opt.type === "array") conf[name as Keys] = v as any;
        if (opt.type === "date") conf[name as Keys] = new Date(v as any) as any;
      }
      return conf;
    },
    {} as ConfigResults<TInput>
  );
  return commandOptions;
}

function extractEnvArgs(options: ConfigOptions) {
  let cliArgs = options._overrideArg || minimist(process.argv.slice(2));
  let envKeys = options._overrideEnv || process.env;
  let originalArgs = {...cliArgs};

  if (!options.caseSensitive) {
    cliArgs = normalizeObjectKeys(cliArgs) as minimist.ParsedArgs;
    envKeys = normalizeObjectKeys(envKeys) as NodeJS.ProcessEnv;
  }
  return { cliArgs, envKeys, originalArgs };
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
    const pkg = getPackageJson(process.cwd());
    const version = pkg?.version || "unknown";

    if (version) {
      console.log("Version:", version);
      return process.exit(0);
    }
    console.error(`No package.json found from path ${__dirname}`);
    return process.exit(1);
  }
  if (args.help) {
    console.log(
      `
  Usage:
    --help:         Show this help message
    --version:      Show the version of this tool
`
    );
    optionsHelp(config, options);
    return process.exit(0);
  }
}

function getOptionSchema({
  commandOption: opt,
}: {
  commandOption: CommandOption;
}) {
  let zType = opt.type === "array" ? z[opt.type](z.string()) : z[opt.type]();
  if (opt.type === "boolean") {
    // @ts-ignore
    zType = zType.optional().default(opt.default || false);
  } else {
    // @ts-ignore
    if (opt.default != null) zType = zType.default(opt.default);
    // @ts-ignore
    if (!opt.required && !("min" in opt)) zType = zType.optional();
  }

  if ("min" in opt && "min" in zType) zType = zType.min(opt.min!);
  if ("max" in opt && "max" in zType) zType = zType.max(opt.min!);
  if ("gte" in opt && "gte" in zType) zType = zType.gte(opt.min!);
  if ("lte" in opt && "lte" in zType) zType = zType.lte(opt.min!);
  if ("gt" in opt && "gt" in zType) zType = zType.gt(opt.min!);
  if ("lt" in opt && "lt" in zType) zType = zType.lt(opt.min!);

  return zType;
}

function getOptionValue({
  commandOption,
  inputCliArgs,
  inputEnvKeys,
  inputOriginalArgs,
}: {
  commandOption: CommandOption;
  inputCliArgs: minimist.ParsedArgs;
  inputEnvKeys: NodeJS.ProcessEnv;
  inputOriginalArgs: ConfigInputs["originalArgs"];
}) {
  const debugLog = debug("auto-config:getOptionValue");
  let { keys, argKeys, envKeys, flag } = commandOption;
  keys = Array.isArray(keys) ? keys : ([keys] as string[]);
  flag = Array.isArray(flag) ? flag : ([flag] as string[]);
  argKeys = Array.isArray(argKeys) ? argKeys : ([argKeys] as string[]);
  envKeys = Array.isArray(envKeys) ? envKeys : ([envKeys] as string[]);


  debugLog('Checking flags:', flag);
  debugLog('Using inputCliArgs:', inputCliArgs);

  // Match CLI args, case insensitive default
  let argNameMatch = [...keys, ...argKeys].find(
    (key) => typeof key === "string" && inputCliArgs[key]
  );
  debugLog('argNameMatch:', argNameMatch);
  const matchingArg = isString(argNameMatch)
    ? inputCliArgs[argNameMatch]
    : null;
  if (matchingArg) return applyType(matchingArg, commandOption.type);

  // **Case sensitive** cli flag checking regardless of ignore case option
  const flagNameMatch = [...flag].find(
    (key) => typeof key === "string" && inputOriginalArgs[key]
  );
  debugLog('flagNameCheck:', flagNameMatch);
  if (flagNameMatch) return applyType(`${inputOriginalArgs[flagNameMatch]}`, commandOption.type);
  
  // Match env keys, case sensitive default
  const envKeyMatch = [...keys, ...envKeys].find(
    (key) => typeof key === "string" && inputEnvKeys[key]
  );
  const matchingEnv = isString(envKeyMatch)
    ? inputEnvKeys[envKeyMatch as any]
    : null;
  if (matchingEnv) return applyType(matchingEnv, commandOption.type);

  if (commandOption.default != null)
    return applyType(`${commandOption.default}`, commandOption.type);

  return null;
}
