import type { CommandOption } from './types';
import tk from 'terminal-kit';
import { termMarkup } from './utils';

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
  const configArray = Object.entries<CommandOption>(config).map(
    ([key, value]) => {
      let { help, args, required } = value;
      args = args == null ? [] : Array.isArray(args) ? args : [args];
      return {
        name: key,
        help,
        required,
        args: args.concat().sort(),
      };
    }
  );

  // @ts-ignore
  terminal.table(
    [
      ['Name', 'Help', 'CLI Args, Env Name(s)'].map(
        (s) => `\n  ${termMarkup.bold(s)}\n\n`
      ),
      ...configArray.map(({ name, help, args }) => [
        formatName(name, config[name as keyof TInput]),
        help,
        args,
      ]),
      ['help', 'Show this help.', '--help'],
      ['version', 'Show the current version.', '--version'],
    ],
    {
      hasBorder: true,
      contentHasMarkup: true,
      borderChars: 'lightRounded',
      borderAttr: { color: 'white' },
      textAttr: { bgColor: 'default' },
      // firstCellTextAttr: { bgColor: "blue" },
      firstRowTextAttr: { bgColor: 'blue', height: 90 },
      // firstColumnTextAttr: { bgColor: "red" },
      width: terminal.width,
      expandToWidth: true,
      fit: true, // Activate all expand/shrink + wordWrap
    }
  );
};
