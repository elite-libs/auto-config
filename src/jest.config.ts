import type { Config } from "@jest/types";

// Sync object
const config: Config.InitialOptions = {
  rootDir: ".",
  preset: "ts-jest/presets/js-with-ts",
  verbose: true,
  testPathIgnorePatterns: ["node_modules", "**/dist/**"],
  resetMocks: true,
  resetModules: true,
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
    // "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
    //   "<rootDir>/src/jestFileTransformer.js",
  }
};

export default config;
