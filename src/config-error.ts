import { ConfigInputs } from "./types";

export default class ConfigError extends Error {
  inputs?: ConfigInputs;
  baseError?: Error;

  constructor(message: string, inputs?: ConfigInputs, baseError?: Error) {
    super(message);
    this.inputs = inputs;
    this.baseError = baseError;
    this.name = 'ConfigError';
    Error.captureStackTrace(this, ConfigError);
  }
}
