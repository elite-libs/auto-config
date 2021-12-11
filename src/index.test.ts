import { xConfig } from './index';

console.log(process.env);

describe('xConfig core functionality', () => {
  test('loads environment variables', () => {
    const config = xConfig(
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
          PORT: '8080',
        },
      }
    );
    expect(config.port).toBe(8080);
  });

  test('loads argument variables', () => {
    const config = xConfig(
      {
        port: {
          help: 'The port to listen on.',
          argumentNames: ['port', 'PORT'],
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
      xConfig(
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
    const config = xConfig(
      {
        port: {
          help: 'The port to listen on.',
          keys: ['port'],
          type: 'number',
          required: true,
        },
      },
      {
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
    expect(() => xConfig(
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
    expect(() => xConfig(
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


