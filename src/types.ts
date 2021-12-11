import minimist from 'minimist';

export type CommandOption = OptionTypeConfig & {
  help?: string;
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
      // _type: string;
      type: 'string';
      default?: string;
      transform?: (input: unknown) => string;
      validate?: (input: string) => boolean;
      min?: number;
      max?: number;
    }
  | {
      // _type: number;
      type: 'number';
      default?: number;
      transform?: (input: unknown) => number;
      validate?: (input: number) => boolean;
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
      validate?: (input: boolean) => boolean;
    }
  | {
      // _type: Date;
      type: 'date';
      default?: Date;
      transform?: (input: unknown) => Date;
      validate?: (input: Date) => boolean;
    }
  | {
      // _type: string[];
      type: 'array';
      default?: any[];
      transform?: (input: unknown) => any[];
      validate?: (input: any[]) => boolean;
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
