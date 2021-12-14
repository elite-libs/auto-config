import type { CommandOption, ConfigOptions } from "./types";
import tk from "terminal-kit";
import { termMarkup } from "./utils";

const { terminal } = tk;

const formatName = (name: string, opt: CommandOption) => {
  // https://github.com/cronvel/terminal-kit/blob/master/doc/markup.md
  const { required, default: defaultValue } = opt;

  if (defaultValue !== undefined) {
    return termMarkup.italic(`[${name}]`) + `=${termMarkup.dim(JSON.stringify(defaultValue))}`;
  }
  if (!required) return termMarkup.italic(`[${name}]`);

  return termMarkup.bold(`${name}*`);
}

export const optionsHelp = function <
  TInput extends { [K in keyof TInput]: CommandOption }
>(
  config: TInput,
  options: ConfigOptions = {
    caseSensitive: false,
  }
) {
  const configArray = Object.entries<CommandOption>(config).map(
    ([key, value]) => {
      let { help, keys, flag, envKeys, argKeys, required } = value;
      keys = keys == null ? [] : Array.isArray(keys) ? keys : [keys];
      flag = flag == null ? [] : Array.isArray(flag) ? flag : [flag];
      envKeys =
        envKeys == null ? [] : Array.isArray(envKeys) ? envKeys : [envKeys];
      argKeys =
        argKeys == null ? [] : Array.isArray(argKeys) ? argKeys : [argKeys];
      return {
        name: key,
        help,
        required,
        keys: renderKeys({ keys, flag, envKeys, argKeys }),
      };
    }
  );

  // @ts-ignore
  terminal.table(
    [
      ["Name", "Help", "Keys (Env + Cli Args Mapping)"].map(s => `\  ${termMarkup.bold(s)}\n\n`),
      ...configArray.map(({ name, help, keys }) => [
        formatName(name, config[name as keyof TInput]),
        help,
        keys,
      ]),
    ],
    {
      hasBorder: true,
      contentHasMarkup: true,
      borderChars: "lightRounded",
      borderAttr: { color: "white" },
      textAttr: { bgColor: "default" },
      // firstCellTextAttr: { bgColor: "blue" },
      firstRowTextAttr: { bgColor: "blue", height: 90} ,
      // firstColumnTextAttr: { bgColor: "red" },
      width: terminal.width,
      expandToWidth: true,
      fit: true, // Activate all expand/shrink + wordWrap
    }
  );
};

const renderKeys = ({
  keys,
  flag,
  envKeys,
  argKeys,
}: {
  keys: string[];
  flag: string[];
  envKeys: string[];
  argKeys: string[];
}) => {
  const argEnvKeys = keys.join(", ");
  const argsFormatted = [...flag, ...argKeys]
    .map((key) => (key.length === 1 ? `-${key}` : `--${key}`))
    .join(" | ");
  const envFormatted = [...envKeys, ...argKeys]
    .map((key) => `${key}`)
    .join(" | ");

  return `any: ${argEnvKeys}
arg: ${argsFormatted}
env: ${envFormatted}`;
};

// declare namespace Terminal {
//   interface  TextTableOptions {

//   }

//   interface Impl {
//     table(tableCells: string[][], textTableOptions?: TextTableOptions): void;

//   }
// }
