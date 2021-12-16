import type { CommandOption } from "./types";
import tk from "terminal-kit";
import { termMarkup } from "./utils";
import debug from "debug";

const { terminal } = tk;

const formatName = (name: string, opt: CommandOption) => {
  const { required, default: defaultValue } = opt;
  if (defaultValue !== undefined) {
    return (
      termMarkup.italic(`[${name}]`) +
      ` = ${termMarkup.dim(JSON.stringify(defaultValue))}`
    );
  }
  if (!required) return termMarkup.italic(`[${name}]`);
  return termMarkup.bold(`${name}*`);
};

export const optionsHelp = function <
  TInput extends { [K in keyof TInput]: CommandOption }
>(config: TInput) {
  const debugLog = debug("auto-config:help");
  debugLog("Building help text...");
  const configArray = Object.entries<CommandOption>(config).map(
    ([key, value]) => {
      let { help, args, required } = value;
      debugLog(`Formatting option ${key} ${JSON.stringify(value)}`);
      // debugLog(`Formatting option ${key} ${JSON.stringify(args)}`);
      args = args == null ? [] : Array.isArray(args) ? args : [args];
      return {
        name: key,
        help,
        required,
        args: args.concat().sort(sortArgsList).join(", "),
      };
    }
  );

  // @ts-ignore
  terminal.table(
    [
      ["Name", "Help", "CLI Args, Env Name(s)"].map(formatTableHeaders),
      ...configArray.map(({ name, help, args }) => [
        formatName(name, config[name as keyof TInput]),
        help,
        args,
      ]),
      ["help", "Show this help.", "--help"],
      ["version", "Show the current version.", "--version"],
    ],
    {
      hasBorder: true,
      contentHasMarkup: true,
      borderChars: "lightRounded",
      borderAttr: { color: "white" },
      textAttr: { bgColor: "default" },
      // firstCellTextAttr: { bgColor: "blue" },
      firstRowTextAttr: { bgColor: "blue", height: 90 },
      // firstColumnTextAttr: { bgColor: "red" },
      width: terminal.width,
      expandToWidth: true,
      fit: true, // Activate all expand/shrink + wordWrap
    }
  );
};

function formatTableHeaders(s: string) {
  return `\n  ${termMarkup.bold(s)}\n\n`;
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
