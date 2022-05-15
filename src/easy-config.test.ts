import { easyConfig } from './easy-config';
import { setEnvKey, mockArgv } from './test/utils';

describe('autoConfig core functionality', () => {
  
  describe('environment variables', () => {
    let resetEnv: () => void;
    beforeEach(() => (resetEnv = setEnvKey('PORT', '8080')));
    afterEach(() => resetEnv());

    it('can parse minimal example', () => {
      const parsePort = (port: number) => (
        (port = parseInt(`${port ?? 1234}`, 10)),
        port > 1000 && port < 60000 ? port : null
      );
      const config = easyConfig({
        port: ['--port', 'PORT'],
      });
      expect(config.port).toBe('8080');
    });
  });

  describe('command arguments', () => {
    let restoreArgv: () => void;
    beforeEach(() => (restoreArgv = mockArgv(['--port', '8080'])));
    afterEach(() => restoreArgv());

    it('can parse minimal example', () => {
      const parsePort = (port: number) => (
        (port = parseInt(`${port ?? 1234}`, 10)),
        port > 1000 && port < 60000 ? port : null
      );
      const config = easyConfig({
        port: ['--port', (s: string) => `${s}`],
      });
      expect(config.port).toBe('8080');
    });
    it('can apply trailing callback', () => {
      const parsePort = (port: number) => (
        (port = parseInt(`${port ?? 1234}`, 10)),
        port > 1000 && port < 60000 ? port : null
      );
      const config = easyConfig({
        port: ['--port', 'PORT', parseInt],
      });
      expect(config.port).toBe(8080);
    });
  });
});
