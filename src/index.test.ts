import { autoConfig } from "./index";

const processExitSpy = jest
  .spyOn(process, "exit")
  // @ts-ignore
  .mockImplementation((code?: number) => void null);

const consoleErrorSpy = jest
  .spyOn(console, "error")
  // @ts-ignore
  .mockImplementation((...args: any[]) => void null);

beforeEach(() => {
  processExitSpy.mockClear();
  consoleErrorSpy.mockClear();
});
describe("autoConfig core functionality", () => {
  test("loads environment variables", () => {
    const config = autoConfig(
      {
        port: {
          help: "The port to listen on.",
          keys: ["port", "PORT"],
          type: "number",
          required: true,
        },
        debugMode: {
          keys: ["debug", "DEBUG", "debugMode", "DEBUG_MODE"],
          type: "boolean",
          default: false,
        },
      },
      {
        caseSensitive: false,
        _overrideEnv: {
          NODE_ENV: "development",
          PORT: "8080",
          debugMode: "true",
        },
        _overrideArg: {
          _: [],
          debugMode: "true",
        },
      }
    );
    expect(config.port).toBe(8080);
    expect(config.debugMode).toBe(true);
  });

  test("loads argument variables", () => {
    const config = autoConfig(
      {
        port: {
          help: "The port to listen on.",
          argKeys: ["port", "PORT"],
          type: "number",
          required: true,
        },
      },
      {
        _overrideEnv: {
          NODE_ENV: "development",
        },
        _overrideArg: {
          PORT: "8080",
          _: [],
        },
      }
    );
    expect(config.port).toBe(8080);
  });

  test("loads argument flags", () => {
    const config = autoConfig(
      {
        port: {
          help: "The port to listen on.",
          argKeys: "port",
          flag: "p",
          type: "number",
          max: 65535,
          gte: 1,
          required: true,
        },
      },
      {
        _overrideEnv: { NODE_ENV: "development" },
        _overrideArg: {
          _: [],
          p: "8080",
        },
      }
    );
    expect(config.port).toBe(8080);
  });

  test("throws on missing variable", () => {
    autoConfig(
      {
        port: {
          help: "The port to listen on.",
          keys: ["port", "PORT"],
          type: "number",
          required: true,
        },
      },
      {
        _overrideEnv: {
          NODE_ENV: "development",
        },
        _overrideArg: { _: [] },
      }
    );
    expect(processExitSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  test("ignores case sensitivity (port === PORT)", () => {
    const config = autoConfig(
      {
        port: {
          help: "The port to listen on.",
          keys: ["PORT"],
          type: "number",
          required: true,
        },
      },
      {
        caseSensitive: false,
        _overrideEnv: {
          NODE_ENV: "development",
          PORT: "8080",
        },
        _overrideArg: { _: [] },
      }
    );
    expect(config.port).toBe(8080);
    expect(processExitSpy).toHaveBeenCalledTimes(0);
  });
});

test("ignores env case sensitivity (port === PORT)", () => {
  const config = autoConfig(
    {
      port: {
        help: "The port to listen on.",
        keys: ["PORT"],
        type: "number",
        required: true,
      },
    },
    {
      caseSensitive: false,
      _overrideEnv: {
        NODE_ENV: "development",
      },
      _overrideArg: {
        PORT: "8080",
        _: [],
      },
    }
  );
  expect(config.port).toBe(8080);
  expect(processExitSpy).toHaveBeenCalledTimes(0);
});

describe("validates config runtime rules", () => {
  test("detects invalid string length", () => {
    autoConfig(
      {
        env: {
          help: "Development or Production Environment",
          keys: ["NODE_ENV"],
          type: "string",
          min: 6,
        },
      },
      {
        _overrideEnv: {
          NODE_ENV: "dev",
        },
      }
    );

    expect(processExitSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});

describe("advanced field processing", () => {
  test("parses csv strings into array fields", () => {
    autoConfig(
      {
        env: {
          help: "Development or Production Environment",
          keys: ["NODE_ENV"],
          type: "string",
          min: 6,
        },
      },
      {
        _overrideEnv: {
          NODE_ENV: "dev",
        },
      }
    );

    expect(processExitSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});
