import minimist from "minimist";

export type CommandOption = OptionTypeConfig & {
  doc?: string;
  keys?: string | string[];
  environmentKeys?: string | string[];
  argumentNames?: string | string[];
  required?: boolean;
};

export type xConfigOptions = {
  caseSensitive?: boolean;
  /** override for testing */
  _overrideEnv?: NodeJS.ProcessEnv;
  /** override for testing */
  _overrideArg?: minimist.ParsedArgs;
};

export type OptionTypeConfig =
  | {
      type: 'string';
      default?: string;
      transform?: (input: unknown) => string;
      validate?: (input: string) => boolean;
    }
  | {
      type: 'number';
      default?: number;
      transform?: (input: unknown) => number;
      validate?: (input: number) => boolean;
    }
  // | {
  //     type: 'bigint';
  //     default?: bigint;
  //     transform?: (input: unknown) => bigint;
  //     validate?: (input: bigint) => boolean;
  //   }
  | {
      type: 'date';
      default?: Date;
      transform?: (input: unknown) => Date;
      validate?: (input: Date) => boolean;
    }
  | {
      type: 'boolean';
      default?: boolean;
      transform?: (input: unknown) => boolean;
      validate?: (input: boolean) => boolean;
    }
  | {
      type: 'array';
      default?: any[];
      transform?: (input: unknown) => any[];
      validate?: (input: any[]) => boolean;
    };
