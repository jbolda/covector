import { it } from "@effection/jest";
import { assemble, mergeIntoConfig, mergeChangesToConfig } from "../src";
import fixtures from "fixturez";
const f = fixtures(__dirname);

const filePart = (filename: string) => ({
  filename,
  path: `.changes/${filename}`,
  extname: "",
  content: "",
});

const assembledChanges = {
  releases: {
    "@namespaced/assemble2": {
      changes: [
        {
          releases: {
            "@namespaced/assemble2": "patch",
            assemble1: "patch",
          },
          summary: "This is a namespaced test.",
        },
      ],
      type: "patch",
    },
    assemble1: {
      changes: [
        {
          releases: {
            assemble1: "patch",
            assemble2: "patch",
          },
          summary: "This is a a double patch test.",
        },
        {
          releases: {
            assemble1: "minor",
            assemble2: "patch",
          },
          summary: "This is a minor/patch test.",
        },
        {
          releases: {
            assemble1: "patch",
            assemble2: "major",
          },
          summary: "This is a patch/major test.",
        },
        {
          releases: {
            "@namespaced/assemble2": "patch",
            assemble1: "patch",
          },
          summary: "This is another double patch test.",
        },
      ],
      type: "minor",
    },
    assemble2: {
      changes: [
        {
          releases: {
            assemble1: "patch",
            assemble2: "patch",
          },
          summary: "This is the copy of the double patch test.",
        },
        {
          releases: {
            assemble1: "minor",
            assemble2: "patch",
          },
          summary: "This is the copy of the minor patch test.",
        },
        {
          releases: {
            assemble1: "patch",
            assemble2: "major",
          },
          summary: "This is the copy of the patch major test.",
        },
      ],
      type: "major",
    },
  },
};

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

describe("assemble changes", () => {
  it("runs", function* () {
    const assembled = yield assemble({
      files: [testTextOne, testTextTwo, testTextThree, testTextFour],
    });
    expect(assembled).toMatchSnapshot();
  });

  it("assembles deps", function* () {
    const assembled = yield assemble({ files: [testTextFive] });
    expect(assembled).toMatchSnapshot();
  });
});

describe("assemble changes in preMode", () => {
  it("with no existing changes", function* () {
    const assembled = yield assemble({
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
    const assembled = yield assemble({
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
    const assembled = yield assemble({
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
    const assembled = yield assemble({
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
    const assembled = yield assemble({
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
    expect.assertions(1);
    try {
      yield assemble({
        files: [emptyChangefile],
      });
    } catch (e: any) {
      expect(e.message).toMatch(
        ".changes/empty-file.md didn't have any packages bumped. Please add a package bump."
      );
    }
  });
});

describe("special bump types", () => {
  it("valid additional bump types", function* () {
    const assembled = yield assemble({
      files: [
        testTextOne,
        testTextTwo,
        testTextThree,
        testTextFour,
        testTextSpecialOne,
      ],
      //@ts-ignore
      config: configSpecial,
    });
    expect(assembled).toMatchSnapshot();
  });

  it("invalid bump types", function* () {
    expect.assertions(1);
    try {
      yield assemble({
        files: [
          testTextOne,
          testTextTwo,
          testTextThree,
          testTextFour,
          testTextSpecialOne,
        ],
        //@ts-ignore
        config,
      });
    } catch (e: any) {
      expect(e.message).toMatch(
        "housekeeping specified for assemble1 is invalid.\n" +
          "Try one of the following: major, minor, patch.\n"
      );
    }
  });

  it("one each valid and invalid", function* () {
    expect.assertions(1);
    try {
      yield assemble({
        files: [testTextSpecialTwo],
        //@ts-ignore
        config: configSpecial,
      });
    } catch (e: any) {
      expect(e.message).toMatch(
        "explosions specified for @namespaced/assemble2 is invalid.\n" +
          "Try one of the following: major, minor, patch, housekeeping, workflows.\n"
      );
    }
  });

  it("handles an only noop", function* () {
    const assembled = yield assemble({
      files: [testTextSpecialOne],
      //@ts-ignore
      config: configSpecial,
    });
    expect(assembled).toMatchSnapshot();
  });
});

describe("merge config test", () => {
  it("merges version", function* () {
    //@ts-ignore
    const mergedVersionConfig = yield mergeChangesToConfig({
      //@ts-ignore
      config,
      assembledChanges,
      command: "version",
    });
    expect(mergedVersionConfig).toMatchSnapshot();
  });

  it("merges version without command", function* () {
    let modifiedConfig = { ...config };
    //@ts-ignore
    delete modifiedConfig.pkgManagers.javascript.version;
    //@ts-ignore
    delete modifiedConfig.packages["assemble2"].version;
    //@ts-ignore
    delete modifiedConfig.packages["@namespaced/assemble1"].version;
    //@ts-ignore
    delete modifiedConfig.packages["@namespaced/assemble2"].version;

    //@ts-ignore
    const mergedVersionConfig = yield mergeChangesToConfig({
      //@ts-ignore
      config: modifiedConfig,
      assembledChanges,
      command: "version",
    });
    expect(mergedVersionConfig).toMatchSnapshot();
  });

  it("merges nested bumps", function* () {
    const nestedAssembledChanges = {
      releases: {
        assemble1: {
          changes: [
            {
              releases: {
                assemble1: "patch",
              },
              summary: "This is a test.",
            },
          ],
          type: "minor",
        },
        assemble2: {
          changes: [
            {
              releases: {
                all: "minor",
              },
              summary: "This is a test.",
            },
          ],
          type: "minor",
        },
        all: {
          changes: [
            {
              releases: {
                all: "minor",
              },
              summary: "This is a test.",
            },
          ],
          type: "minor",
        },
      },
    };

    const nestedConfig = {
      packages: {
        assemble1: {
          path: "./packages/assemble1",
          version: true,
          dependencies: ["assemble1", "all"],
        },
        assemble2: {
          path: "./packages/assemble2",
          version: true,
          dependencies: ["all"],
        },
        all: {
          version: true,
        },
      },
    };

    //@ts-ignore
    const mergedVersionConfig = yield mergeChangesToConfig({
      //@ts-ignore
      config: nestedConfig,
      assembledChanges: nestedAssembledChanges,
      command: "version",
    });
    expect(mergedVersionConfig).toMatchSnapshot();
  });

  it("merges publish", function* () {
    const configFolder = f.copy("assemble");

    const mergedPublishConfig = yield mergeIntoConfig({
      cwd: configFolder,
      //@ts-ignore
      config,
      //@ts-ignore
      assembledChanges: [],
      command: "publish",
    });
    expect(mergedPublishConfig).toMatchSnapshot();
  });
});

describe("merge filtered config test", () => {
  it("merges version", function* () {
    //@ts-ignore
    const mergedVersionConfig = yield mergeChangesToConfig({
      //@ts-ignore
      config,
      assembledChanges,
      command: "version",
      filterPackages: ["assemble1", "@namespaced/assemble1"],
    });
    expect(mergedVersionConfig).toMatchSnapshot();
  });

  it("merges publish", function* () {
    const configFolder = f.copy("assemble");

    //@ts-ignore
    const mergedPublishConfig = yield mergeIntoConfig({
      cwd: configFolder,
      //@ts-ignore
      config,
      assembledChanges,
      command: "publish",
      filterPackages: ["assemble1", "@namespaced/assemble1"],
    });
    expect(mergedPublishConfig).toMatchSnapshot();
  });
});
