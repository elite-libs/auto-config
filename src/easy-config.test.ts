import { easyConfig } from './easy-config';
import { setEnvKey, mockArgv } from './test/utils';

const parsePort = (port: number) => (
  (port = parseInt(`${port ?? 1234}`, 10)),
  port > 1000 && port < 60000 ? port : null
);
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
        port: ['--port', (s: string) => `${s}`],
      });
      expect(config.port).toBe('8080');
    });
    it('can infer type from callback return type', () => {
      const config = easyConfig({
        port: ['--port', 'PORT', parseInt],
      });
      expect(typeof config.port).toBe('number');
      expect(config.port).toEqual(8080);
    });
  });
});
