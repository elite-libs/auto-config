import minimist from 'minimist';

/**
 * CommandOption defines a system config parameter.
 * Includes where to load the value from, which names to check for, and any validation rules.
 */
export type CommandOption = OptionTypeConfig & {
  /** Inline Documentation, used to render `--help` and provide intelligent error messages. */
  help?: string;
  /** flag will only match command line args like `-p` or `-X`, not `--X`
   * keys matches either command line arguments OR environment vars.
   * You can prefix strings with either `-` or `--` to indicate they are cli args. */
  args?: string | string[];
  /** Throw an error on missing value. */
  required?: boolean;
};

export type OptionTypeConfig =
  | {
      type?: 'string';
      default?: string;
      transform?: (input: unknown) => string;
      min?: number;
      max?: number;
    }
  | {
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
      type: 'boolean';
      default?: boolean;
      transform?: (input: unknown) => boolean;
    }
  | {
      type: 'date';
      default?: Date;
      transform?: (input: unknown) => Date;
    }
  | {
      type: 'array';
      default?: Array<string | number | boolean | Date | null>;
      transform?: (input: unknown) => string[];
      min?: number;
      max?: number;
    };

export type ConfigInputs = {
  cliArgs: minimist.ParsedArgs;
  envKeys: NodeJS.ProcessEnv;
};

export type ConfigResults<
  TConfig extends { [K in keyof TConfig]: CommandOption }
> = {
  [K in keyof TConfig]: TConfig[K]['required'] extends true
    ? NonNullable<GetTypeByTypeString<TConfig[K]['type']>>
    : Nullable<GetTypeByTypeString<TConfig[K]['type']>>;
};

export type Nullable<T> = T | null | undefined;

export type GetTypeByTypeString<TType extends string | undefined> =
  TType extends 'string'
    ? string
    : TType extends 'number'
    ? number
    : TType extends 'array'
    ? string[]
    : TType extends 'boolean'
    ? boolean
    : TType extends 'date'
    ? Date
    : TType extends undefined
    ? string
    : never;
