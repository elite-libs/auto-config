import { Table } from 'console-table-printer';
import type { CommandOption, ConfigOptions } from './types';

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
  const table = new Table({
    title: 'Options',
    columns: [
      { name: 'name', alignment: 'left' },
      { name: 'help', alignment: 'left' },
      { name: 'required', alignment: 'right', color: 'red', maxLen: 5 },
      { name: 'keys', alignment: 'right', minLen: 20 },
    ]
  })

  table.addRows(configArray);
  return table.render()
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
  const argEnvKeys = keys.join(', ');
  const argsFormatted = [...flag, ...argKeys]
    .map((key) => (key.length === 1 ? `-${key}` : `--${key}`))
    .join(' | ');
  const envFormatted = [...envKeys, ...argKeys]
    .map((key) => `${key}`)
    .join(' | ');

    return `any: ${argEnvKeys}
arg: ${argsFormatted}
env: ${envFormatted}`;
};
