# @justsml/auto-config

## Automatic Configuration Library

> A Unified Config & Arguments Library for Node.js!
>
> Featuring support for environment variables, command line arguments, and JSON/YAML/INI files!

## Example

```ts
// `./src/config.ts`
export default autoConfig({
  port: {
    help: 'The port to listen on.',
    keys: ['port', 'PORT'],
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
});
```

###  TODO

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

* [nconf](https://github.com/indexzero/nconf) - setter & getter adds layer I didn't want.
* [conf](https://github.com/sindresorhus/conf) - too opinionated (writing to disk)
* [node-convict]()
* rc
* yargs
* commander
* gluegun
* [configstore](https://github.com/yeoman/configstore)
