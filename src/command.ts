import debug from 'debug';
import { autoConfig } from 'src';
import { CommandOption, CompleteConfig, OptionTypeConfig } from './types';

type Commands<TInput> = {
  [commandName: string]: CompleteConfig<TInput>;
  // TODO: Add Commands
};
type OptionTypes = NonNullable<OptionTypeConfig['type']>;

type AutoCommandOptions = {
  cliArgs: string[];
  envKeys: Record<string, string | undefined>;
};

const defaultOptions = {
  cliArgs: process.argv.slice(2),
  envKeys: process.env,
} as const;

export default function autoCommand<TInput extends object>(
  commandConfig: Commands<TInput>,
  {
    cliArgs = process.argv.slice(2),
    envKeys = process.env,
  }: AutoCommandOptions = defaultOptions
) {
  const debugLog = debug('auto-command');
  debugLog(`Starting Command Processor for args: ${cliArgs.join(', ')}`);
  const availableCommands = Object.keys(commandConfig);
  debugLog('availableCommands', availableCommands);
  // TODO
  // 1. check for sub-commands in argv
  // 2. if sub-command found, split the argv, and use autoConfig on the following arguments
  const baseCommand = cliArgs[0];
  debugLog(`Looking for base command: ${baseCommand}`);
  if (baseCommand && availableCommands.includes(baseCommand)) {
    debugLog(`Found base command: ${baseCommand}`);
    const subCommandConfig = commandConfig[baseCommand];
    debugLog('subCommandConfig', subCommandConfig);
    autoConfig(subCommandConfig, {
      overrides: {cliArgs, envKeys}
    })
    // if (typeof subCommandConfig === 'object') {
    //   return autoCommand(subCommandConfig);
    // }
  }
  // const matchingCommand = process.argv.find(arg => availableCommands.includes(arg));
}
