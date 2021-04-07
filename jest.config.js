module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  modulePathIgnorePatterns: ["__fixtures__"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.base.json",
    },
  },
};
