import { CommandOption } from "./types";

type Commands = {
  [key: string]: CommandOption | Commands;
}

export default function autoCommand(commandConfig: Commands) {
  const availableCommands = Object.keys(commandConfig);
  // TODO
  // 1. check for sub-commands in argv
  // 2. if sub-command found, split the argv, and use autoConfig on the following arguments
  const baseCommand = process.argv[2];
  if (baseCommand && availableCommands.includes(baseCommand)) {
    const subCommandConfig = commandConfig[baseCommand];
    if (typeof subCommandConfig === "object") {
      return autoCommand(subCommandConfig);
    }
    
  }
  // const matchingCommand = process.argv.find(arg => availableCommands.includes(arg));
}