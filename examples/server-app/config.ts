// import { autoConfig } from '@elite-libs/auto-config';
import { autoConfig } from '../../dist/index';

export default autoConfig({
  databaseUrl: {
    help: 'The Postgres connection string.',
    args: ['--databaseUrl', '--db', 'DATABASE_URL'],
    required: true,
  },
  port: {
    help: 'The port to start server on.',
    args: ['--port', '-p', 'PORT'],
    type: 'number',
    required: true,
  },
  debugMode: {
    help: 'Debug mode.',
    args: ['--debug', '-D'],
    type: 'boolean',
    default: false,
  },
});
