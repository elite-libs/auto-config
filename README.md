# @elite-libs/auto-config

[![CI Status](https://github.com/elite-libs/auto-config/workflows/test/badge.svg)](https://github.com/elite-libs/auto-config/actions)
[![NPM version](https://img.shields.io/npm/v/@elite-libs/auto-config.svg)](https://www.npmjs.com/package/@elite-libs/auto-config)
[![GitHub stars](https://img.shields.io/github/stars/elite-libs/auto-config.svg?style=social)](https://github.com/elite-libs/auto-config)
<!-- [![Dependency Status](https://img.shields.io/david/elite-libs/auto-config.svg)](https://david-dm.org/elite-libs/auto-config) -->
<!-- [![Code Climate](https://img.shields.io/codeclimate/github/elite-libs/auto-config.svg)](https://codeclimate.com/github/elite-libs/auto-config) -->
<!-- [![Coverage Status](https://img.shields.io/codecov/c/github/elite-libs/auto-config.svg)](https://codecov.io/gh/elite-libs/auto-config) -->

## Intro

> A Unified Config & Arguments Library for Node.js!
>
> Featuring support for environment variables, command line arguments, and (soon) JSON/YAML/INI files!

## Why

There are so many config libraries, do we really need another??? Well, possibly!

[No existing library I tried](#credit-and-references) met my requirements.

My goals & requirements include:

* Enable dynamic app config. [See '12 Factor App' on Config](https://12factor.net/config)
* TypeScript support.
* Portable pattern (not filesystem-locked, browser support.)
* Simple, memorable & terse config format.

<!--
As described in [12 Factor App's chapter on Config](https://12factor.net/config), these are the typical use-cases for this library:

* Resource handles to the database, Memcached, and other backing services.
* Credentials to external services such as Amazon S3 or Twitter.
* Per-deploy values such as the canonical hostname for the deploy. -->

> Table of Contents

* [Intro](#intro)
* [Why](#why)
* [Example: AWS Access Config](#example-aws-access-config)
* [Example: Web App with Database Config](#example-web-app-with-database-config)
* [Example: Linux Move Command Arguments](#example-linux-move-command-arguments)
* [Example: Runtime Usage Behavior](#example-runtime-usage-behavior)
  * [Command line arguments](#command-line-arguments)
  * [Mix of environment and command arguments](#mix-of-environment-and-command-arguments)
  * [Single-letter flag arguments](#single-letter-flag-arguments)
  * [Error on required fields](#error-on-required-fields)
  * [`--help` CLI Output](#cli-help-output)
  * [TODO](#todo)
  * [Credit and References](#credit-and-references)

## Install

```bash
npm install @elite-libs/auto-config

yarn add @elite-libs/auto-config
```

## Example: AWS Access Config

```ts
// `./src/aws-config.ts`
import { autoConfig } from '@elite-libs/auto-config';
import AWS from 'aws-sdk';

const awsConfig = getAwsConfig();

AWS.config.update({
  ...awsConfig,
  endpointDiscoveryEnabled: true,
});

function getAwsConfig() {
  return autoConfig({
    region: {
      help: 'AWS Region',
      args: ['--region', '-r', 'AWS_REGION'],
      default: 'us-west-1',
      required: true,
    },
    accessKeyId: {
      help: 'AWS Access Key ID',
      args: ['--access-key-id', 'AWS_ACCESS_KEY_ID'],
      required: true,
    },
    secretAccessKey: {
      help: 'AWS Secret Access Key',
      args: ['--secret-access-key', 'AWS_SECRET_ACCESS_KEY'],
      required: true,
    },
  });
}
```

## Example: Web App with Database Config

```ts
// `./src/config.ts`
import { autoConfig } from '@elite-libs/auto-config';

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
```

```ts
// `./src/server.js`
import express from 'express';
import catRouter from './routes/cat';
import config from './config';

const { port, debugMode } = config;

const logMode = debugMode ? "dev" : "combined";

export const app = express()
  .use(express.json())
  .use(express.urlencoded({ extended: false }))
  .use(morgan(logMode))
  .get('/', (req, res) => res.send('Welcome to my API'))
  .use('/cat', catRouter);

app.listen(port)
  .on('error', console.error)
  .on('listening', () =>
    console.log(`Started server: http://0.0.0.0:${port}`);
  );
```

## Example: Linux Move Command Arguments

```ts
const moveOptions = autoConfig({
  force: {
    args: '-f',
    help: 'Do not prompt for confirmation before overwriting the destination path.  (The -f option overrides any previous -i or -n options.)'
    type: 'boolean',
  },
  interactive: {
    args: '-i',
    help: 'Cause mv to write a prompt to standard error before moving a file that would overwrite an existing file.  If the response from the standard input begins with the character `y` or `Y`, the move is attempted.  (The -i option overrides any previous -f or -n options.)'
    type: 'boolean',
  },
  noOverwrite: {
    args: '-n',
    help: 'Do not overwrite an existing file.  (The -n option overrides any previous -f or -i options.)',
    type: 'boolean',
  },
  verbose: {
    args: '-v',
    help: 'Cause mv to be verbose, showing files after they are moved.',
    type: 'boolean',
  }
});
```

## Example: Runtime Usage Behavior

### Command line arguments

```bash
node ./src/app.js \
  --port 8080 \
  --databaseUrl 'postgres://localhost/postgres' \
  --debug
# { port: 8080, databaseUrl: 'postgres://localhost/postgres', debug: true }
```

### Mix of environment and command arguments

```bash
DATABASE_URL=postgres://localhost/postgres \
  node ./src/app.js \
    --port 8080 \
    --debug
# { port: 8080, databaseUrl: 'postgres://localhost/postgres', debug: true }
```

### Single-letter flag arguments

```bash
node ./src/app.js \
  -D \
  --port 8080 \
  --databaseUrl 'postgres://localhost/postgres'
# { port: 8080, databaseUrl: 'postgres://localhost/postgres', debug: true }
```

### Error on required fields

```bash
node ./src/app.js \
  --port 8080
# Error: databaseUrl is required.
```

### CLI Help Output

```bash
node ./src/app.js --help
```

```bash
╭───────────────────────────┬────────────────────────────────────────────┬──────────────────────────────────────────────────────────╮
│                           │                                            │                                                          │
│  Name                     │  Help                                      │  CLI Args, Env Name(s)                                   │
│                           │                                            │                                                          │
├───────────────────────────┼────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
│databaseUrl*               │The Postgres connection string.             │--databaseUrl, DATABASE_URI, DATABASE_URL                 │
├───────────────────────────┼────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
│port*                      │The port to serve content from.             │-p, --port                                                │
├───────────────────────────┼────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
│[debugMode] = false        │Debug mode.                                 │-D, --debug                                               │
├───────────────────────────┼────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
│help                       │Show this help.                             │--help                                                    │
├───────────────────────────┼────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
│version                    │Show the current version.                   │--version                                                 │
╰───────────────────────────┴────────────────────────────────────────────┴──────────────────────────────────────────────────────────╯
```

## TODO

* [ ] Add option to include the `_` or `__` args from minimist. (Overflow/unparsed extra args.)
* [ ] Enum support.
* [ ] Inverting boolean flags with `--no-debug` versus `--debug`.
* [ ] Plugin modules with minimal overhead. (e.g. 3rd party loaders: AWS SSM, AppConfig, Firebase Config,  etc.)
  * Example args: `{ssm:/app/flags/path/admin_dashboard}`
    * `['{ssm:/app/flags/path/admin_dashboard}', 'FLAG_ADMIN_DASHBOARD_ENABLED', '--flagAdminDashboard', '--flag-admin-dashboard']`
* [ ] Support for loading files, and structured data with dotted key paths.
  * Example args: `{config.flags.admin_dashboard}`
    * `['{config.flags.admin_dashboard}', 'FLAG_ADMIN_DASHBOARD_ENABLED', '--flagAdminDashboard', '--flag-admin-dashboard']`
* [x] Auto `--help` output.
* [x] `--version` output.
* [x] `default` values.
* [x] `required` values.
* [x] Zod validators for `optional`, `min`, `max`, `gt`, `gte`, `lt`, `lte`.

## Credit and References

Projects researched, with any notes on why it wasn't a good fit.

* [yargs](https://github.com/yargs/yargs) - like the fluent API, and command syntax. Could use as base library. Env vars could be handled via `default` helper function to check for env keys. Or we could transform yargs config into overlapping format.
* [commander](https://github.com/tj/commander.js) - like the many ways to configure arguments. Could probably be used as underlying library, however initial attempt was slower than starting from scratch.
* [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) - focused too much on disk-backed config.
* [rc](https://github.com/dominictarr/rc) - focused on 'magically' locating disk-backed config.
* [node-convict](https://github.com/mozilla/node-convict/tree/master/packages/convict) - great pattern, but limited TypeScript support.
* [nconf](https://github.com/indexzero/nconf) - setter & getter, plus the hierarchy adds extra layers.
* [conf](https://github.com/sindresorhus/conf) - too opinionated (writing to disk.) Interesting use of JSON Schemas, Versioning, and Migrations.
* [gluegun](https://github.com/infinitered/gluegun) - great design, focused on opinionated design of CLI apps though.
* [configstore](https://github.com/yeoman/configstore) - replaced by conf.
