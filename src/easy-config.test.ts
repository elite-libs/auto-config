import { easyConfig } from './easy-config';
import { setEnvKey, mockArgv } from './test/utils';

const parsePort = (value: unknown): number | never => {
  let port = parseInt(`${value}`, 10);
  if (port >= 1000 && port < 65635) {
    return port;
  }
  throw Error(`Invalid port: ${port}. Must be between 1000-65635.`);
}

describe('easyConfig', () => {

  describe('environment variables', () => {
    let resetEnv: () => void;
    beforeEach(() => (resetEnv = setEnvKey('PORT', '8080')));
    afterEach(() => resetEnv());

    it('can parse minimal example', () => {
      const config = easyConfig({
        port: ['--port', 'PORT'],
      });
      expect(config.port).toBe('8080');
    });
  });

  describe('callback function', () => {
    let restoreArgv: () => void;
    beforeEach(() => (restoreArgv = mockArgv(['--port', '8080'])));
    afterEach(() => restoreArgv());

    it('can set default via callback', () => {
      const config = easyConfig({
        userId: ['--user-id', (s: string) => parseInt(s) ?? 123456],
      });
      expect(config.userId).toBe(123456);
    });

    it('can set default via callback', () => {
      const config = easyConfig({
        id: ['--id', (s: string) => parseInt(s) ?? 123456],
      });
      expect(config.id).toBe('8080');
    });

    it('can infer type from callback return type', () => {
      const config = easyConfig({
        port: ['--port', 'PORT', Number],
      });
      expect(typeof config.port).toBe('number');
      expect(config.port).toEqual(8080);
    });
  });
});
