import { xConfig } from "./"


describe('xConfig', () => {
  test('works', () => {
    const config = xConfig({
      port: {
        doc: 'The port to listen on.',
        keys: ['port', 'PORT'],
        type: 'number',
        required: true,
      }
    }, {
      _overrideEnv: {
        PORT: '8080'
      }
    });
    expect(config.port).toBe(8080);
  })
})
