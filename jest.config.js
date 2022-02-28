module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  modulePathIgnorePatterns: ["__fixtures__"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.base.json",
    },
  },
  modulePaths: ["<rootDir>/packages/"],
  moduleNameMapper: {
    "^covector/(.*)$": "<rootDir>/packages/covector/$1",
    "^@covector/(.*)$": "<rootDir>/packages/$1/src",
  },
};
