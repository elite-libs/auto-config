# @justsml/auto-config

[![NPM version](https://img.shields.io/npm/v/@justsml/auto-config.svg)](https://www.npmjs.com/package/@justsml/auto-config)
[![CI Status](https://github.com/justsml/auto-config/workflows/test/badge.svg)](https://github.com/justsml/auto-config/actions)

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
* [Example](#example)
  * [Configuring your App Dynamically](#configuring-your-app-dynamically)
    * [Command line arguments](#command-line-arguments)
    * [Mix of environment and command arguments](#mix-of-environment-and-command-arguments)
    * [Single-letter flag arguments](#single-letter-flag-arguments)
    * [Error on required fields](#error-on-required-fields)
    * [`--help` CLI Output](#--help-cli-output)
  * [TODO](#todo)
  * [Credit and References](#credit-and-references)

## Install


```bash
npm install @justsml/auto-config

yarn add @justsml/auto-config
```

## Example

```ts
// `./src/config.ts`
import { autoConfig } from '@justsml/auto-config';

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
// `./src/app.js`
import config from './config';
console.log(config);
```

### Configuring your App Dynamically

#### Command line arguments

```bash
node ./src/app.js \
  --port 8080 \
  --databaseUrl 'postgres://localhost/postgres' \
  --debug
# { port: 8080, databaseUrl: 'postgres://localhost/postgres', debug: true }
```

#### Mix of environment and command arguments

```bash
DATABASE_URL=postgres://localhost/postgres \
  node ./src/app.js \
    --port 8080 \
    --debug
# { port: 8080, databaseUrl: 'postgres://localhost/postgres', debug: true }
```

#### Single-letter flag arguments

```bash
node ./src/app.js \
  -D \
  --port 8080 \
  --databaseUrl 'postgres://localhost/postgres'
# { port: 8080, databaseUrl: 'postgres://localhost/postgres', debug: true }
```

#### Error on required fields

```bash
node ./src/app.js \
  --port 8080
# Error: databaseUrl is required.
```

#### CLI Help Output

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

### TODO

* [ ] Enum support.
* [ ] Inverting boolean flags with `--no-debug` versus `--debug`.
* [x] Auto `--help` output.
* [x] `--version` output.
* [x] `default` values.
* [x] `required` values.
* [x] Zod validators for `optional`, `min`, `max`, `gt`, `gte`, `lt`, `lte`.

### Credit and References

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
