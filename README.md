# xConfig

```ts
// `./src/config.ts`
export default xConfig({
  port: {
    doc: 'The port to listen on.',
    keys: ['port'],
    type: 'number',
    required: true,
  },
  databaseUrl: {
    doc: 'The Postgres connection string.',
    keys: ['databaseUrl', 'DATABASE_URL', 'DATABASE_URI'],
    type: 'number',
    required: true,
  },
});

```
