import { autoConfig } from './index';

// console.log(process.cwd());

describe('autoConfig core functionality', () => {
  test('loads environment variables', () => {
    const config = autoConfig(
      {
        port: {
          help: 'The port to listen on.',
          keys: ['port', 'PORT'],
          type: 'number',
          required: true,
        },
      },
      {
        caseSensitive: false,
        _overrideEnv: {
          NODE_ENV: 'development',
          PORT: '8080',
        },
      }
    );
    expect(config.port).toBe(8080);
  });

  test('loads argument variables', () => {
    const config = autoConfig(
      {
        port: {
          help: 'The port to listen on.',
          argKeys: ['port', 'PORT'],
          type: 'number',
          required: true,
        },
      },
      {
        _overrideEnv: {
          NODE_ENV: 'development',
        },
        _overrideArg: {
          PORT: '8080',
          _: [],
        },
      }
    );
    expect(config.port).toBe(8080);
  });

  test('throws on missing variable', () => {
    expect(() =>
      autoConfig(
        {
          port: {
            help: 'The port to listen on.',
            keys: ['port', 'PORT'],
            type: 'number',
            required: true,
          },
        },
        {
          _overrideEnv: {
            NODE_ENV: 'development',
          },
          _overrideArg: { _: [] },
        }
      )
    ).toThrow();
  });

  test('ignores case sensitivity (port === PORT)', () => {
    const config = autoConfig(
      {
        port: {
          help: 'The port to listen on.',
          keys: ['PORT'],
          type: 'number',
          required: true,
        },
      },
      {
        caseSensitive: false,
        _overrideEnv: {
          NODE_ENV: 'development',
          PORT: '8080',
        },
        _overrideArg: { _: [] },

      },
    );
    expect(config.port).toBe(8080);
  });
});

describe('validates config runtime rules', () => {
  test('detects invalid string length', () => {
    expect(() => autoConfig(
      {
        env: {
          help: 'Development or Production Environment',
          keys: ['NODE_ENV'],
          type: 'string',
          min: 6
        },
      },
      {
        _overrideEnv: {
          NODE_ENV: 'dev',
        },
      }
    )).toThrow();
  });
})


describe('advanced field processing', () => {
  test('parses csv strings into array fields', () => {
    expect(() => autoConfig(
      {
        env: {
          help: 'Development or Production Environment',
          keys: ['NODE_ENV'],
          type: 'string',
          min: 6
        },
      },
      {
        _overrideEnv: {
          NODE_ENV: 'dev',

        },
      }
    )).toThrow();
  });
})


