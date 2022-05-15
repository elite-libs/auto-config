import { ZodError } from 'zod';
import { ConfigInputsParsed } from './types';

export default class ConfigError<
  TError extends Error | undefined = undefined
> extends Error {
  inputs?: ConfigInputsParsed;
  baseError?: TError;

  constructor(message: string, inputs?: ConfigInputsParsed, baseError?: TError) {
    super(message);
    this.baseError = baseError;
    this.inputs = inputs;
    this.name = 'ConfigError';
    Error.captureStackTrace(this, ConfigError);
    this.message = this.getDetails();
  }

  getDetails() {
    let fieldErrors = '';
    if (this.baseError instanceof ZodError) {
      fieldErrors = this.baseError.errors.map(error => {
        return `${error.path.join('.')}: ${error.message}.`;
      }).join(' ');
    }
    return `${this.name}: ${this.message} ` + fieldErrors;
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
      inputs: this.inputs,
      // baseError: this.baseError,
    };
  }
}
