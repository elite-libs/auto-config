import { autoConfig } from './index';
import { mockArgv, setEnvKey } from './test/utils';

import minimist from 'minimist';
console.log('process.argv', process.argv);
console.log('minimist', minimist(process.argv.slice(2)))

describe('autoCommand CLI functionality', () => {
  test('handles sub-commands', () => {
    const resetEnv = setEnvKey('PORT', '8080');

    const command = autoConfig({
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
    resetEnv();
    // expect(config.port).toBe(8080);
    // expect(config.debugMode).toBe(true);
  });
});
