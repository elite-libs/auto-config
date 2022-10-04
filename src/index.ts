import * as z from "zod";
import minimist from "minimist";
import isString from "lodash.isstring";
import debug from "debug";
import chalk from "chalk";
import path from "path";
import {
  applyType,
  cleanupStringList,
  getEnvAndArgs,
  stripDashes,
} from "./utils";
import type { CommandOption, ConfigInputsParsed, ConfigResults } from "./types";
import { optionsHelp } from "./render";
import forOwn from "lodash/forOwn.js";

export { easyConfig } from "./easy-config";

export const autoConfig = function <
  TInput extends { [K in keyof TInput]: CommandOption }
>(config: TInput) {
  const debugLog = debug("auto-config");
  debugLog("START: Loading runtime environment & command line arguments.");
  let { cliArgs, envKeys } = getEnvAndArgs();
  if (debugLog.enabled) {
    debugLog("runtime.cliArgs", JSON.stringify(cliArgs));
    debugLog("runtime.envKeys", JSON.stringify(envKeys));
    debugLog("config.keys", Object.keys(config).sort().join(", "));
  }

  type Keys = keyof TInput;

  checkSpecialArgs(cliArgs, config);

  const schemaObject = buildSchema(config);

  // @ts-ignore
  let commandOptions = wrapGetterSetter(
    assembleConfigResults(config, {
      cliArgs,
      envKeys,
    })
  );
  debugLog("commandOptions=", commandOptions);

  verifySchema(schemaObject, commandOptions, {
    cliArgs,
    envKeys,
  });

  const initialConfig = Object.freeze(commandOptions);

  debugLog("DONE", JSON.stringify(commandOptions));
  return {
    ...commandOptions,
    _reset: reset,
    _set: set,
  };
  function set(key: Keys | object, value?: any) {
    const pairValues =
      typeof key === "object" ? Object.entries(key) : [[key, value]];

    pairValues.forEach(([key, value]) => {
      if (key in commandOptions) commandOptions[key as Keys] = value;
    });
    return commandOptions;
  }

  function reset() {
    Object.entries(initialConfig).forEach(([key, value]) => {
      commandOptions[key as Keys] = initialConfig[key as Keys];
    });
  }
  
  function wrapGetterSetter<TInput extends { [K in keyof TInput]: TInput[K] }>(
    data: TInput
  ) {
    return new Proxy(data, {
      get(target: TInput, prop: Keys | any) {
        if (prop in target) {
          return data[prop as Keys];
        }
      },
      set(target: TInput, prop: Keys | any, value: any) {
        if (prop in target) {
          data[prop as Keys] = value;
          return true;
        }
        return false;
      },
    });
  }
};

function buildSchema<TInput extends { [K in keyof TInput]: CommandOption }>(
  config: TInput
) {
  const schemaObject = z.object(
    Object.entries<CommandOption>(config).reduce(
      (schema, [name, commandOption]) => {
        commandOption.type = commandOption.type || "string";
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
  inputs: ConfigInputsParsed
): Record<string, unknown> {
  const debugLog = debug("auto-config:verifySchema");
  const parseResults = schema.safeParse(config);
  debugLog("parse success?", parseResults.success);
  if (!parseResults.success) {
    const { issues } = parseResults.error;
    debugLog("parse success?", parseResults.success);
    const fieldErrors = issues.reduce((groupedResults, issue) => {
      groupedResults[issue.message] = groupedResults[issue.message] || [];
      groupedResults[issue.message].push(
        issue.path.join(".") + " " + issue.code
      );
      return groupedResults;
    }, {} as Record<string, string[]>);

    const errorList = Object.entries(fieldErrors)
      .map(
        ([message, errors]) =>
          `  - ${chalk.magentaBright(message)}: ${errors.join(", ")}`
      )
      .join("\n");
    throw new Error(`${chalk.red.bold`ERROR:`} Found ${
      issues.length
    } Config Problem(s)!

Fix the following ${
      issues.length
    } issue(s). (tip: try '--help' output for more details.)

${errorList}`);
  }
  return parseResults.data;
}

function assembleConfigResults<
  TInput extends { [K in keyof TInput]: CommandOption }
>(config: TInput, input: ConfigInputsParsed) {
  const { cliArgs, envKeys } = input;

  type Keys = keyof TInput;

  const commandOptions = Object.entries<CommandOption>(config).reduce(
    (conf, [name, opt]) => {
      if (opt) {
        opt.type = opt.type || "string";
        const v = getOptionValue({
          commandOption: opt,
          inputCliArgs: cliArgs,
          inputEnvKeys: envKeys,
        });
        conf[name as Keys] = v as any;
        // if (!opt.type || opt.type === 'string')
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

function checkSpecialArgs(
  args: minimist.ParsedArgs | undefined,
  config: { [K in string]: CommandOption }
) {
  if (args?.version) {
    // const pkg = getPackageJson(process.cwd());
    const version = process.env.npm_package_version || "unknown";

    if (version) {
      console.log("Version:", version);
      return void null;
    }
    console.error(`No package.json found from path ${__dirname}`);
    return process.exit(1);
  }
  if (args?.help) {
    const pkgName =
      process.env.npm_package_name ||
      path.basename(path.dirname(process.argv[1])) ||
      "This app";
    console.log(
      `\n${chalk.underline.bold.greenBright(
        pkgName
      )} has the following options:`
    );
    console.log(optionsHelp(config));
    return process.exit(0);
  }
}

function getOptionSchema({
  commandOption: opt,
}: {
  commandOption: CommandOption;
}) {
  let zType =
    opt.type === "array"
      ? z.array(z.string())
      : opt.type === "enum"
      ? z.enum(opt.enum)
      : z[opt.type || "string"]();
  if (opt.type === "boolean") {
    // @ts-ignore
    zType = zType.default(opt.default || false);
  } else {
    // @ts-ignore
    if (!opt.required && !("min" in opt)) zType = zType.optional();
  }
  // @ts-ignore
  if (opt.default !== undefined) zType = zType.default(opt.default);

  if ("min" in opt && typeof opt.min === "number" && "min" in zType)
    zType = zType.min(opt.min);
  if ("max" in opt && typeof opt.max === "number" && "max" in zType)
    zType = zType.max(opt.max);
  if ("gte" in opt && typeof opt.gte === "number" && "gte" in zType)
    zType = zType.gte(opt.gte);
  if ("lte" in opt && typeof opt.lte === "number" && "lte" in zType)
    zType = zType.lte(opt.lte);
  if ("gt" in opt && typeof opt.gt === "number" && "gt" in zType)
    zType = zType.gt(opt.gt);
  if ("lt" in opt && typeof opt.lt === "number" && "lt" in zType)
    zType = zType.lt(opt.lt);

  return zType;
}

function extractArgs(args: string[]) {
  return args.reduce(
    (result, arg) => {
      if (arg.startsWith("--")) {
        result.cliArgs.push(arg);
        return result;
      }
      if (arg.startsWith("-")) {
        result.cliFlag.push(arg);
        return result;
      }
      if (typeof arg === "string" && arg.length > 0) result.envKeys.push(arg);
      return result;
    },
    {
      cliArgs: [] as string[],
      cliFlag: [] as string[],
      envKeys: [] as string[],
    }
  );
}

function getOptionValue({
  commandOption,
  inputCliArgs,
  inputEnvKeys,
}: {
  commandOption: CommandOption;
  inputCliArgs?: minimist.ParsedArgs;
  inputEnvKeys?: NodeJS.ProcessEnv;
}) {
  const debugLog = debug("auto-config:getOption");
  let { args, default: defaultValue } = commandOption;
  args = cleanupStringList(args);

  const { cliArgs, cliFlag, envKeys } = extractArgs(args);
  debugLog("args", args.join(", "));
  debugLog("cliArgs", cliArgs);
  debugLog("cliFlag", cliFlag);
  debugLog("envKeys", envKeys);
  debugLog("inputCliArgs:", inputCliArgs);
  // debugLog('inputEnvKeys:', Object.keys(inputEnvKeys).filter((k) => !k.startsWith('npm')).sort());
  debugLog("Checking.cliArgs:", [...cliFlag, ...cliArgs]);
  // Match CLI args
  let argNameMatch = stripDashes(
    [...cliFlag, ...cliArgs].find(
      (key) => typeof key === "string" && inputCliArgs?.[stripDashes(key)]
    )
  );
  debugLog("argNameMatch:", argNameMatch);
  const matchingArg = isString(argNameMatch)
    ? inputCliArgs?.[argNameMatch]
    : undefined;
  debugLog("argValueMatch:", matchingArg);
  if (matchingArg) return applyType(matchingArg, commandOption.type);

  // Match env vars
  const envNameMatch = [...envKeys].find(
    (key) => typeof key === "string" && inputEnvKeys?.[key]
  );
  debugLog("envNameMatch:", envNameMatch);
  const matchingEnv = isString(envNameMatch)
    ? inputEnvKeys?.[envNameMatch as any]
    : undefined;
  debugLog("envValueMatch:", matchingEnv);
  if (matchingEnv) return applyType(matchingEnv, commandOption.type);

  if (commandOption.default != undefined)
    return applyType(`${commandOption.default}`, commandOption.type);

  return defaultValue || undefined;
}
