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
  transform?: (input: unknown) => unknown;
};

export type OptionTypeConfig =
  | OptionTypeEnum
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


export type CompleteConfig<TInput> = { [K in keyof TInput]: CommandOption };

// type Flatten<Type> = Type extends Array<infer Item> ? Item : Type;
// type GetEnumOption<TOption> = TOption extends { enum: Array<infer EnumItem> } ? EnumItem : never;
export type PrimitiveTypes = string | number | boolean | Date | null;
export type EnumTypes = string; // | number;

type OptionTypeEnum = {
  type: 'enum';
  enum: Readonly<[EnumTypes, ...EnumTypes[]]>;
  default?: string;
  // default?: keyof OptionTypeConfig['enum'];
  transform?: (input: unknown) => string;
};

export type ConfigInputsRaw = {
  cliArgs?: string[];
  envKeys?: Record<string, string | undefined>;
};

export type ConfigInputsParsed = {
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
export type Undefinedable<T> = T | undefined;

export type GetTypeByTypeString<TType extends string | undefined> =
  TType extends 'string'
    ? string
    : TType extends 'number'
    ? number
    : TType extends 'array'
    ? string[]
    : TType extends 'boolean'
    ? boolean
    : TType extends 'enum'
    ? string
    : TType extends 'date'
    ? Date
    : TType extends undefined
    ? Undefinedable<string>
    : string; // Was `never` - that's wrong default arg type!
