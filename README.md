# @justsml/auto-config

## Automatic Configuration Library

> A Unified Config & Arguments Library for Node.js!
>
> Featuring support for environment variables, command line arguments, and JSON/YAML/INI files!

## Example

```ts
// `./src/config.ts`
import { autoConfig } from '@justsml/auto-config';

export default autoConfig({
  port: {
    help: 'The port to listen on.',
    keys: ['port'],
    flag: 'p',
    type: 'number',
    required: true,
  },
  databaseUrl: {
    help: 'The Postgres connection string.',
    keys: ['databaseUrl', 'DATABASE_URL', 'DATABASE_URI'],
    type: 'string',
    required: true,
  },
  debugMode: {
    help: 'Debug mode.',
    type: 'boolean',
    cliKeys: 'debug',
    flag: 'D',
  },
});
```

```ts
// `./src/app.js`
import config from './config';

console.log(config);
```

## Example Usage

Using only command line arguments.

```bash
node ./app.js --port 8080 --databaseUrl 'postgres://localhost/postgres' --debug
# { port: 8080, databaseUrl: 'postgres://localhost/postgres', debug: true }
```

Mix of environment and command arguments.

```bash
DATABASE_URL=postgres://localhost/postgres \
  node ./app.js --port 8080 --debug
# { port: 8080, databaseUrl: 'postgres://localhost/postgres', debug: true }
```

Single letter flag arguments.

```bash
node ./app.js --port 8080 --databaseUrl 'postgres://localhost/postgres' --debug
# { port: 8080, databaseUrl: 'postgres://localhost/postgres', debug: true }
```

Error detection for required values.

```bash
node ./app.js --port 8080 --debug
# Error: databaseUrl is required.
```

### TODO

- [ ] Auto `--help` output.
- [ ] `--version` output.
- [ ] Enum support.
- [x] `default` values.
- [x] `required` values.
- [x] Zod validators for `optional`, `min`, `max`, `gt`, `gte`, `lt`, `lte`.

### Ideas

- [ ] Restrict `arg` or `env` value with string prefix on `keys` array.

### Credit & References

Projects researched, with any notes on why it wasn't a good fit.

- [yargs](https://github.com/yargs/yargs) - like the fluent API, and command syntax. Could use as base library. Env vars could be handled via `default` helper function to check for env keys. Or we could transform yargs config into overlapping format.
- [commander](https://github.com/tj/commander.js) - like the many ways to configure arguments. Could probably be used as underlying library, however initial attempt was slower than starting from scratch.
- [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) - focused too much on disk-backed config.
- [rc](https://github.com/dominictarr/rc) - focused on 'magically' locating disk-backed config.
- [node-convict](https://github.com/mozilla/node-convict/tree/master/packages/convict) - great pattern, but limited TypeScript support.
- [nconf](https://github.com/indexzero/nconf) - setter & getter, plus the hierarchy adds extra layers.
- [conf](https://github.com/sindresorhus/conf) - too opinionated (writing to disk.) Interesting use of JSON Schemas, Versioning, and Migrations.
- [gluegun](https://github.com/infinitered/gluegun) - great design, focused on CLI apps though. Environment var support is missing.
- [configstore](https://github.com/yeoman/configstore) - replaced by conf.
