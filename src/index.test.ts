import { xConfig } from './index';

describe('xConfig', () => {
  test('loads environment variables', () => {
    const config = xConfig(
      {
        port: {
          doc: 'The port to listen on.',
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
          doc: 'The port to listen on.',
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
            doc: 'The port to listen on.',
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

  test('can match with case insensitivity (port === PORT)', () => {
    const config = xConfig(
      {
        port: {
          doc: 'The port to listen on.',
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
