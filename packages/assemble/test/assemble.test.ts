import { assemble } from "../src";
import { captureError, describe, it } from "../../../helpers/test-scope.ts";
import { expect } from "vitest";
import pino from "pino";
import * as pinoTest from "pino-test";

const filePart = (filename: string) => ({
  filename,
  path: `.changes/${filename}`,
  extname: "",
  content: "",
});

const config = {
  pkgManagers: {
    javascript: {
      version: "lerna version ${ release.type } --no-git-tag-version --no-push",
      publish: "npm publish",
    },
  },
  packages: {
    assemble1: {
      path: "./packages/assemble1",
      manager: "javascript",
      dependencies: ["all"],
    },
    assemble2: {
      path: "./packages/assemble2",
      version: "lerna version ${ release.type }",
      dependencies: ["all"],
    },
    "@namespaced/assemble1": {
      path: "./packages/namespaced-assemble2",
      manager: "cargo",
      version: "cargo version ${ release.type }",
      publish: "cargo publish",
      dependencies: ["assemble1", "all"],
    },
    "@namespaced/assemble2": {
      path: "./packages/namespaced-assemble2",
      manager: "cargo",
      version: "cargo version ${ release.type }",
      publish: "cargo publish",
      dependencies: ["assemble2", "all"],
    },
    all: {
      version: true,
    },
  },
};

const configSpecial = {
  ...config,
  additionalBumpTypes: ["housekeeping", "workflows"],
};

const testTextOne = {
  ...filePart("testTextOne"),
  content: `
---
"assemble1": patch
"assemble2": patch
---
    
This is a test.
`,
};
const testTextTwo = {
  ...filePart("testTextTwo"),
  content: `
---
"assemble1": minor
"assemble2": patch
---
    
This is a test.
`,
};
const testTextThree = {
  ...filePart("testTextThree"),
  content: `
---
"assemble1": patch
"assemble2": major
---
    
This is a test.
`,
};
const testTextFour = {
  ...filePart("testTextFour"),
  content: `
---
"assemble1": patch
"@namespaced/assemble2": patch
---
    
This is a test. We might link out to a [website](https://www.jacobbolda.com).
`,
};
const testTextFive = {
  ...filePart("testTextFive"),
  content: `
---
"all": minor
---
  
This is a test.
`,
};
const testTextSpecialOne = {
  ...filePart("testTextSpecialOne"),
  content: `
---
"assemble1": housekeeping
"assemble2": workflows
---
  
This is a test.
`,
};
const testTextSpecialTwo = {
  ...filePart("testTextSpecialTwo"),
  content: `
---
"assemble1": patch
"assemble2": workflows
"@namespaced/assemble2": explosions
---
  
This is a test.
`,
};

describe("assemble", () => {
  describe("assemble changes", () => {
    it("runs", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      const assembled = yield assemble({
        logger,
        files: [testTextOne, testTextTwo, testTextThree, testTextFour],
      });
      expect(assembled).toMatchSnapshot();
    });

    it("assembles deps", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      const assembled = yield assemble({ logger, files: [testTextFive] });
      expect(assembled).toMatchSnapshot();
    });
  });

  describe("assemble changes in preMode", () => {
    it("with no existing changes", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      const assembled = yield assemble({
        logger,
        files: [testTextOne, testTextTwo, testTextThree, testTextFour],
        preMode: { on: true, prevFiles: [] },
      });
      expect(assembled.releases).toMatchObject({
        "@namespaced/assemble2": { type: "prepatch" },
      });
      expect(assembled.releases).toMatchObject({
        assemble1: { type: "preminor" },
      });
      expect(assembled.releases).toMatchObject({
        assemble2: { type: "premajor" },
      });
      expect(assembled).toMatchSnapshot();
    });

    it("with existing changes that upgrade", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      const assembled = yield assemble({
        logger,
        files: [testTextOne, testTextTwo, testTextThree, testTextFour],
        preMode: { on: true, prevFiles: [testTextOne.path] },
      });
      expect(assembled.changes).not.toEqual(
        expect.arrayContaining([
          {
            releases: { assemble1: "patch", assemble2: "patch" },
            summary: "This is a test.",
          },
        ])
      );
      expect(assembled.releases).toMatchObject({
        "@namespaced/assemble2": { type: "prepatch" },
      });
      expect(assembled.releases).toMatchObject({
        assemble1: { type: "preminor" },
      });
      expect(assembled.releases).toMatchObject({
        assemble2: { type: "premajor" },
      });
      expect(assembled).toMatchSnapshot();
    });

    it("with existing changes with the same bump", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      const assembled = yield assemble({
        logger,
        files: [testTextOne, testTextTwo, testTextFour],
        preMode: { on: true, prevFiles: [testTextOne.path] },
      });
      expect(assembled.changes).not.toEqual(
        expect.arrayContaining([
          {
            releases: { assemble1: "patch", assemble2: "patch" },
            summary: "This is a test.",
          },
        ])
      );
      expect(assembled.releases).toMatchObject({
        "@namespaced/assemble2": { type: "prepatch" },
      });
      expect(assembled.releases).toMatchObject({
        assemble1: { type: "preminor" },
      });
      expect(assembled.releases).toMatchObject({
        assemble2: { type: "prerelease" },
      });
      expect(assembled).toMatchSnapshot();
    });

    it("with existing changes and a first bump", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      const assembled = yield assemble({
        logger,
        files: [testTextOne, testTextTwo],
        preMode: { on: true, prevFiles: [testTextOne.path] },
      });
      expect(assembled.changes).not.toEqual(
        expect.arrayContaining([
          {
            releases: { assemble1: "patch", assemble2: "patch" },
            summary: "This is a test.",
          },
        ])
      );
      expect(assembled.releases).toMatchObject({
        assemble1: { type: "preminor" },
      });
      expect(assembled.releases).toMatchObject({
        assemble2: { type: "prerelease" },
      });
      expect(assembled).toMatchSnapshot();
    });

    it("with existing changes and a lower bump", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      const assembled = yield assemble({
        logger,
        files: [testTextOne, testTextTwo],
        preMode: { on: true, prevFiles: [testTextTwo.path] },
      });
      expect(assembled.changes).not.toEqual(
        expect.arrayContaining([
          {
            releases: { assemble1: "minor", assemble2: "patch" },
            summary: "This is a test.",
          },
        ])
      );
      expect(assembled.releases).toMatchObject({
        assemble1: { type: "prerelease" },
      });
      expect(assembled.releases).toMatchObject({
        assemble2: { type: "prerelease" },
      });
      expect(assembled).toMatchSnapshot();
    });
  });

  describe("errors on bad change files", () => {
    const emptyChangefile = {
      path: ".changes/empty-file.md",
      extname: "",
      filename: "empty-file.md",
      content: `---
---
  
This doesn't bump much.
`,
    };

    it("throws on no changes", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      expect.assertions(1);
      const e = yield captureError(
        assemble({
          logger,
          files: [emptyChangefile],
        })
      );
      expect(e.message).toMatch(
        ".changes/empty-file.md didn't have any packages bumped. Please add a package bump."
      );
    });
  });

  describe("special bump types", () => {
    it("valid additional bump types", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      const assembled = yield assemble({
        logger,
        files: [
          testTextOne,
          testTextTwo,
          testTextThree,
          testTextFour,
          testTextSpecialOne,
        ],
        config: configSpecial,
      });
      expect(assembled).toMatchSnapshot();
    });

    it("invalid bump types", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      expect.assertions(1);
      const e = yield captureError(
        assemble({
          logger,
          files: [
            testTextOne,
            testTextTwo,
            testTextThree,
            testTextFour,
            testTextSpecialOne,
          ],
          config,
        })
      );
      expect(e.message).toMatch(
        "housekeeping specified for assemble1 is invalid.\n" +
          "Try one of the following: major, minor, patch.\n"
      );
    });

    it("one each valid and invalid", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      expect.assertions(1);
      const e = yield captureError(
        assemble({
          logger,
          files: [testTextSpecialTwo],
          config: configSpecial,
        })
      );
      expect(e.message).toMatch(
        "explosions specified for @namespaced/assemble2 is invalid.\n" +
          "Try one of the following: major, minor, patch, housekeeping, workflows.\n"
      );
    });

    it("handles an only noop", function* () {
      const stream = pinoTest.sink();
      const logger = pino(stream);

      const assembled = yield assemble({
        logger,
        files: [testTextSpecialOne],
        config: configSpecial,
      });
      expect(assembled).toMatchSnapshot();
    });
  });
});
