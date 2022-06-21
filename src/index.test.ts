import { autoConfig } from './index';
import { mockArgv, setEnvKey } from './test/utils';

const processExitSpy = jest
  .spyOn(process, 'exit')
  // @ts-ignore
  .mockImplementation((code?: number) => void null);

beforeEach(() => {
  processExitSpy.mockClear();
});

describe.only('core features', () => {
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
    const fn = () => autoConfig({
      port: {
        help: 'The port to listen on.',
        args: ['port', 'PORT'],
        type: 'number',
        required: true,
      },
    });
    expect(fn).toThrowError(/required/i);
  });

  test('supports non-standard argument casing, e.g. --PORT', () => {
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
});

describe('runtime validation', () => {
  test('detects invalid string length', () => {
    const fn = () => {
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
    }
    expect(fn).toThrowError()
  });
});

describe('enums', () => {
  let resetEnv: () => void;
  beforeEach(() => (resetEnv = setEnvKey('FEATURE_FLAG_A', 'variant1')));
  afterEach(() => resetEnv());

  test('detects invalid enum value', () => {
    const fn = () => {
      const resetEnv = setEnvKey('FEATURE_FLAG_A', 'v1');
      autoConfig({
        featureFlagA: {
          args: ['FEATURE_FLAG_A'],
          type: 'enum',
          enum: ['variant1', 'variant2'],
        },
      });
      resetEnv();
    };
    expect(fn).toThrowError();
  });
  test('detects valid enum value', () => {
    const resetEnv = setEnvKey('FEATURE_FLAG_A', 'variant1');
    const config = autoConfig({
      featureFlagA: {
        args: ['FEATURE_FLAG_A'],
        type: 'enum',
        enum: ['variant1', 'variant2'] as const,
      },
    });

    expect(config.featureFlagA).toBe('variant1');
    resetEnv();
  });
  test('supports enum default values', () => {
    const getConfigError = () =>
      autoConfig({
        featureFlagA: {
          args: ['FEATURE_FLAG_A'],
          type: 'enum',
          enum: ['1', '2', '34'] as const,
          default: 'variant1',
        },
      });

    expect(getConfigError).toThrowError();
  });
});

describe('parsing', () => {
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
    expect(config.flags).toEqual(['dev', 'qa', 'prod', 'staging']);
  });
});
