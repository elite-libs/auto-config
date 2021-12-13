import minimist from 'minimist';

/**
 * CommandOption defines a system config parameter.
 * Includes where to load the value from, which names to check for, and any validation rules.
 */
export type CommandOption = OptionTypeConfig & {
  /** Inline Documentation, used to render `--help` and provide intelligent error messages. */
  help?: string;
  /** keys matches either command line arguments OR environment vars. You can prefix strings with either `-` or `--` to indicate they are cli args. */
  keys?: string | string[];
  /** flag will only match command line args like `-p` or `-X`, not `--X` */
  flag?: string | string[];
  /** Matches only on environment variables. Defaults to case insensitive mode. */
  envKeys?: string | string[];
  /** Matches only command line args. Defaults to case insensitive mode. */
  argKeys?: string | string[];
  /** Throw an error on missing value. */
  required?: boolean;
};

export type ConfigOptions = {
  caseSensitive?: boolean;
  /** override for testing */
  _overrideEnv?: NodeJS.ProcessEnv;
  /** override for testing */
  _overrideArg?: minimist.ParsedArgs;
};

export type OptionTypeConfig =
  | {
      // _type: string;
      type: 'string';
      default?: string;
      transform?: (input: unknown) => string;
      min?: number;
      max?: number;
    }
  | {
      // _type: number;
      type: 'number';
      default?: number;
      transform?: (input: unknown) => number;
      min?: number;
      max?: number;
      gt?: number;
      lt?: number;
      gte?: number;
      lte?: number;
      positive?: boolean;
    }
  | {
      // _type: boolean;
      type: 'boolean';
      default?: boolean;
      transform?: (input: unknown) => boolean;
    }
  | {
      // _type: Date;
      type: 'date';
      default?: Date;
      transform?: (input: unknown) => Date;
    }
  | {
      // _type: string[];
      type: 'array';
      default?: any[];
      transform?: (input: unknown) => string[];
      min?: number;
      max?: number;
    };

export type ExtractOptionType<T> = T extends { type: 'string' }
  ? string | null
  : T extends { type: 'number' }
  ? number | null
  : T extends { type: 'boolean' }
  ? boolean | null
  : T extends { type: 'Date' }
  ? Date | null
  : T extends { type: 'array' }
  ? string[] | null
  : undefined;

export type ConfigInputs = {
  cliArgs: minimist.ParsedArgs;
  envKeys: NodeJS.ProcessEnv;
};

export type ConfigState = {
  input: ConfigInputs;
  inputArgKeys: string[];
  inputEnvKeys: string[];
}

export type ConfigResults<TConfig extends { [K in keyof TConfig]: any }> = {
  [K in keyof TConfig]?: ExtractOptionType<TConfig[K]>;
};

// export type ConfigResults<TConfig extends { [K in keyof TConfig]: any }> = {
//   [K in keyof TConfig]?: TConfig[K] extends { _type: string } ? string : any;
// };

/*

export type ConfigResults<TConfig> = {
  [K in keyof TConfig]?: TConfig[K] extends { type: 'string' }
  ? string | null
  : TConfig[K] extends { type: 'number' }
  ? number | null
  : TConfig[K] extends { type: 'boolean' }
  ? boolean | null
  : TConfig[K] extends { type: 'Date' }
  ? Date | null
  : TConfig[K] extends { type: 'array' }
  ? string[] | null
  : undefined;
};

*/
