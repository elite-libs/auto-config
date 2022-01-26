import { autoConfig } from './index';
import { mockArgv, setEnvKey } from './test/utils';

const processExitSpy = jest
  .spyOn(process, 'exit')
  // @ts-ignore
  .mockImplementation((code?: number) => void null);

const consoleErrorSpy = jest
  .spyOn(console, 'error')
  // @ts-ignore
  .mockImplementation((...args: any[]) => void null);

beforeEach(() => {
  processExitSpy.mockClear();
  consoleErrorSpy.mockClear();
});
describe('autoConfig core functionality', () => {
  test('loads environment variables', () => {
    const resetPort = setEnvKey('PORT', '8080');
    const config = autoConfig({
      port: {
        help: 'The port to listen on.',
        args: ['--port', 'PORT'],
        type: 'number',
        required: true,
      },
      debugMode: {
        args: ['--debug', 'DEBUG', '--debugMode', 'DEBUG_MODE'],
        type: 'boolean',
        default: true,
      },
    });
    resetPort();
    expect(config.port).toBe(8080);
    expect(config.debugMode).toBe(true);
  });

  test('loads argument variables', () => {
    const restoreArgv = mockArgv(['--port', '8080']);
    const config = autoConfig({
      port: {
        help: 'The port to listen on.',
        args: ['--port', 'PORT'],
        type: 'number',
        required: true,
      },
    });
    restoreArgv();
    expect(config.port).toBe(8080);
  });

  test('loads argument flags', () => {
    const restoreArgv = mockArgv(['-p', '8080']);
    const config = autoConfig({
      port: {
        help: 'The port to listen on.',
        args: ['port', '-p'],
        type: 'number',
        max: 65535,
        gte: 1,
        required: true,
      },
    });
    restoreArgv();
    expect(config.port).toBe(8080);
  });

  test('throws on missing variable', () => {
    autoConfig({
      port: {
        help: 'The port to listen on.',
        args: ['port', 'PORT'],
        type: 'number',
        required: true,
      },
    });
    expect(processExitSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  test('supports non-standard arguments, e.g. --PORT', () => {
    const restoreArgv = mockArgv(['--PORT', '8080']);
    const config = autoConfig({
      port: {
        help: 'The port to listen on.',
        args: ['--PORT'],
        type: 'number',
        required: true,
      },
    });
    restoreArgv();
    expect(config.port).toBe(8080);
    expect(processExitSpy).toHaveBeenCalledTimes(0);
  });

  test('handles non-required fields', () => {
    const resetPort = setEnvKey('NOT_PORT', '8080');
    const config = autoConfig({
      port: {
        help: 'The port to listen on.',
        args: ['--port', 'PORT'],
        type: 'number',
      },
    });
    resetPort();
    expect(config.port).toBeUndefined();
  });

  test('supports undefined "type"\'s as string types', () => {
    const config = autoConfig({
      stageName: {
        help: 'The cloud environment/stack to target.',
        args: ['--stage-name', 'STAGE_NAME'],
      },
    });
    expect(config.stageName).toBeUndefined();
  });


});

test('ignores env case sensitivity (port === PORT)', () => {
  process.env.PORT = '8080';
  const config = autoConfig({
    port: {
      help: 'The port to listen on.',
      args: ['PORT'],
      type: 'number',
      required: true,
    },
  });
  process.env.PORT = undefined;
  expect(config.port).toBe(8080);
  expect(processExitSpy).toHaveBeenCalledTimes(0);
});

describe('validates config runtime rules', () => {
  test('detects invalid string length', () => {
    const resetEnv = setEnvKey('NODE_ENV', 'dev');
    autoConfig({
      env: {
        help: 'Development or Production Environment',
        args: ['NODE_ENV'],
        type: 'string',
        min: 6,
      },
    });
    resetEnv();
    expect(processExitSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});

describe('advanced field processing', () => {
  test('parses csv strings into array fields', () => {
    const resetEnv = setEnvKey('FLAGS', 'dev,qa,prod,staging');
    const config = autoConfig({
      flags: {
        help: 'Flags to pass to the application',
        args: ['--flags', 'FLAGS'],
        type: 'array',
      },
    });
    resetEnv();
    expect(processExitSpy).toHaveBeenCalledTimes(0);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(0);
    expect(config.flags).toEqual(['dev', 'qa', 'prod', 'staging']);
  });
});
