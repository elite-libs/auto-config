import type { CommandOption } from "./types";
import debug from "debug";
import columnify from "columnify";
import chalk from "chalk";

const formatName = (name: string, opt: CommandOption) => {
  const { required, default: defaultValue } = opt;
  if (defaultValue !== undefined) {
    return (
      chalk.italic(`[${name}]`) +
      ` = ${chalk.dim(JSON.stringify(defaultValue))}`
    );
  }
  if (!required) return chalk.italic(`${name}`);
  return chalk.bold(`${name}${chalk.bold.redBright`*`}`);
};

const formatArg = (arg: string) => {
  // if (arg.startsWith("--")) return chalk.magentaBright.italic`${arg}`;
  // if (arg.startsWith("-")) return chalk.yellowBright.italic`${arg}`;
  if (arg.startsWith("-")) return chalk.magentaBright.italic`${arg}`;
  if (arg === arg.toLocaleUpperCase()) return chalk.cyanBright.italic`${arg}`;
  return "\n" + chalk.dim.italic`${arg}`;
};

export const optionsHelp = function <
  TInput extends { [K in keyof TInput]: CommandOption }
>(config: TInput) {
  const debugLog = debug("auto-config:help");
  debugLog("Building help text...");
  const configArray = Object.entries<CommandOption>(config).map(
    ([name, value]) => {
      let { help, args } = value;
      debugLog(`Formatting option ${name} ${JSON.stringify(value)}`);
      // debugLog(`Formatting option ${key} ${JSON.stringify(args)}`);
      args = args == null ? [] : Array.isArray(args) ? args : [args];
      return {
        Name: formatName(name, value),
        "CLI & Env Args": args
          .concat()
          .sort(sortArgsList)
          .map(formatArg)
          .join(", ")
          .padEnd(3, " "),
        Help: help,
        // "CLI & Env Args": args.concat().map(formatArg).join(", "),
      };
    }
  );

  const [cols, rows] = process.stdout.getWindowSize();
  configArray.push(
    { Name: "help", "CLI & Env Args": "--help", Help: "Show this help." },
    {
      Name: "version",
      "CLI & Env Args": "--version",
      Help: "Show the current version.",
    }
  );
  return columnify(configArray, {
    // minWidth: 25,
    maxLineWidth: "auto",
    columns: ["Name", "CLI & Env Args", "Help"],
    headingTransform: (data: string) => {
      return chalk.bold.cyanBright.underline`${data}`;
    },
    preserveNewLines: true,
    config: {
      "Name": {
        // dataTransform: (data: string) => ' ‣  ' + data,
      },
      "CLI & Env Args": {
        // minWidth: 30,
      },
      Help: {
        truncate: false,
        preserveNewLines: true,
        // minWidth: Number((cols * 0.50).toFixed(0)),
        // maxWidth: Number((cols * 0.75).toFixed(0)),
      },
    },
  });
  // // @ts-ignore
  // terminal.table(
  //   [
  //     ["Name", "Help", "CLI Args, Env Name(s)"].map(formatTableHeaders),
  //     ...configArray.map(({ name, help, args }) => [
  //       formatName(name, config[name as keyof TInput]),
  //       help,
  //       args,
  //     ]),
  //     ["help", "Show this help.", "--help"],
  //     ["version", "Show the current version.", "--version"],
  //   ],
  //   {
  //     hasBorder: true,
  //     contentHasMarkup: true,
  //     borderChars: "lightRounded",
  //     borderAttr: { color: "white" },
  //     textAttr: { bgColor: "default" },
  //     // firstCellTextAttr: { bgColor: "blue" },
  //     firstRowTextAttr: { bgColor: "blue", height: 90 },
  //     // firstColumnTextAttr: { bgColor: "red" },
  //     width: terminal.width,
  //     expandToWidth: true,
  //     fit: true, // Activate all expand/shrink + wordWrap
  //   }
  // );
};

function formatTableHeaders(s: string) {
  return `\n  ${chalk.bold(s)}\n\n`;
}

const isFlagArg = (arg: string) => arg.startsWith("-") && !arg.startsWith("--");
const isLongArg = (arg: string) => arg.startsWith("--");

function sortArgsList(a1: string, a2: string): 0 | 1 | -1 {
  if (isFlagArg(a1) && isFlagArg(a2)) return 0;
  if (isLongArg(a1) && isLongArg(a2)) return 0;
  if (isFlagArg(a1) && isLongArg(a2)) return -1;
  if (isLongArg(a1) && isFlagArg(a2)) return 1;
  const compared = a1.localeCompare(a2);
  return compared === 0 ? 0 : compared > 0 ? 1 : -1;
}
