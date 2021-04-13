import { assemble, mergeIntoConfig, mergeChangesToConfig } from "./index";
import fixtures from "fixturez";
const f = fixtures(__dirname);

const vfilePart = { path: "", extname: "", data: { filename: "" } };

const assembledChanges = {
  releases: {
    "@namespaced/assemble2": {
      changes: [
        {
          releases: {
            "@namespaced/assemble2": "patch",
            assemble1: "patch",
          },
          summary: "This is a test.",
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
          summary: "This is a test.",
        },
        {
          releases: {
            assemble1: "minor",
            assemble2: "patch",
          },
          summary: "This is a test.",
        },
        {
          releases: {
            assemble1: "patch",
            assemble2: "major",
          },
          summary: "This is a test.",
        },
        {
          releases: {
            "@namespaced/assemble2": "patch",
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
            assemble1: "patch",
            assemble2: "patch",
          },
          summary: "This is a test.",
        },
        {
          releases: {
            assemble1: "minor",
            assemble2: "patch",
          },
          summary: "This is a test.",
        },
        {
          releases: {
            assemble1: "patch",
            assemble2: "major",
          },
          summary: "This is a test.",
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
  ...vfilePart,
  contents: `
---
"assemble1": patch
"assemble2": patch
---
    
This is a test.
`,
};
const testTextTwo = {
  ...vfilePart,
  contents: `
---
"assemble1": minor
"assemble2": patch
---
    
This is a test.
`,
};
const testTextThree = {
  ...vfilePart,
  contents: `
---
"assemble1": patch
"assemble2": major
---
    
This is a test.
`,
};
const testTextFour = {
  ...vfilePart,
  contents: `
---
"assemble1": patch
"@namespaced/assemble2": patch
---
    
This is a test. We might link out to a [website](https://www.jacobbolda.com).
`,
};
const testTextFive = {
  ...vfilePart,
  contents: `
---
"all": minor
---
  
This is a test.
`,
};
const testTextSpecialOne = {
  ...vfilePart,
  contents: `
---
"assemble1": housekeeping
"assemble2": workflows
---
  
This is a test.
`,
};
const testTextSpecialTwo = {
  ...vfilePart,
  contents: `
---
"assemble1": patch
"assemble2": workflows
"@namespaced/assemble2": explosions
---
  
This is a test.
`,
};

describe("assemble changes", () => {
  it("runs", function* (): Generator<any> {
    const assembled = yield assemble({
      vfiles: [testTextOne, testTextTwo, testTextThree, testTextFour],
    });
    expect(assembled).toMatchSnapshot();
  });

  it("assembles deps", function* (): Generator<any> {
    const assembled = yield assemble({ vfiles: [testTextFive] });
    expect(assembled).toMatchSnapshot();
  });
});

describe("assemble changes in preMode", () => {
  it("with no existing changes", function* (): Generator<any> {
    const assembled = yield assemble({
      vfiles: [testTextOne, testTextTwo, testTextThree, testTextFour],
      preMode: { on: true, prevFiles: [] },
    });
    expect(assembled).toMatchSnapshot();
  });

  it("with existing changes that upgrade", function* (): Generator<any> {
    const assembled = yield assemble({
      vfiles: [testTextOne, testTextTwo, testTextThree, testTextFour],
      preMode: { on: true, prevFiles: [testTextOne] },
    });
    expect(assembled).toMatchSnapshot();
  });

  it("with existing changes with the same bump", function* (): Generator<any> {
    const assembled = yield assemble({
      vfiles: [testTextOne, testTextTwo, testTextFour],
      preMode: { on: true, prevFiles: [testTextOne] },
    });
    expect(assembled).toMatchSnapshot();
  });
});

describe("special bump types", () => {
  it("valid additional bump types", function* (): Generator<any> {
    const assembled = yield assemble({
      vfiles: [
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

  it("invalid bump types", function* (): Generator<any> {
    expect.assertions(1);
    try {
      yield assemble({
        vfiles: [
          testTextOne,
          testTextTwo,
          testTextThree,
          testTextFour,
          testTextSpecialOne,
        ],
        //@ts-ignore
        config,
      });
    } catch (e) {
      expect(e.message).toMatch(
        "housekeeping specified for assemble1 is invalid.\n" +
          "Try one of the following: major, minor, patch.\n"
      );
    }
  });

  it("one each valid and invalid", function* (): Generator<any> {
    expect.assertions(1);
    try {
      yield assemble({
        vfiles: [testTextSpecialTwo],
        //@ts-ignore
        config: configSpecial,
      });
    } catch (e) {
      expect(e.message).toMatch(
        "explosions specified for @namespaced/assemble2 is invalid.\n" +
          "Try one of the following: major, minor, patch, housekeeping, workflows.\n"
      );
    }
  });

  it("handles an only noop", function* (): Generator<any> {
    const assembled = yield assemble({
      vfiles: [testTextSpecialOne],
      //@ts-ignore
      config: configSpecial,
    });
    expect(assembled).toMatchSnapshot();
  });
});

describe("merge config test", () => {
  it("merges version", function* (): Generator<any> {
    const mergedVersionConfig = yield mergeChangesToConfig({
      //@ts-ignore
      config,
      assembledChanges,
      command: "version",
    });
    expect(mergedVersionConfig).toMatchSnapshot();
  });

  it("merges version without command", function* (): Generator<any> {
    let modifiedConfig = { ...config };
    //@ts-ignore
    delete modifiedConfig.pkgManagers.javascript.version;
    //@ts-ignore
    delete modifiedConfig.packages["assemble2"].version;
    //@ts-ignore
    delete modifiedConfig.packages["@namespaced/assemble1"].version;
    //@ts-ignore
    delete modifiedConfig.packages["@namespaced/assemble2"].version;

    const mergedVersionConfig = yield mergeChangesToConfig({
      //@ts-ignore
      config: modifiedConfig,
      assembledChanges,
      command: "version",
    });
    expect(mergedVersionConfig).toMatchSnapshot();
  });

  it("merges nested bumps", function* (): Generator<any> {
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

    const mergedVersionConfig = yield mergeChangesToConfig({
      //@ts-ignore
      config: nestedConfig,
      assembledChanges: nestedAssembledChanges,
      command: "version",
    });
    expect(mergedVersionConfig).toMatchSnapshot();
  });

  it("merges publish", function* (): Generator<any> {
    const configFolder = f.copy("assemble");

    const mergedPublishConfig = yield mergeIntoConfig({
      cwd: configFolder,
      //@ts-ignore
      config,
      //@ts-ignore
      assembledChanges: [],
      command: "publish",
    });
    expect(scrubVfile(mergedPublishConfig)).toMatchSnapshot();
  });
});

describe("merge filtered config test", () => {
  it("merges version", function* (): Generator<any> {
    const mergedVersionConfig = yield mergeChangesToConfig({
      //@ts-ignore
      config,
      assembledChanges,
      command: "version",
      filterPackages: ["assemble1", "@namespaced/assemble1"],
    });
    expect(mergedVersionConfig).toMatchSnapshot();
  });

  it("merges publish", function* (): Generator<any> {
    const configFolder = f.copy("assemble");

    const mergedPublishConfig = yield mergeIntoConfig({
      cwd: configFolder,
      //@ts-ignore
      config,
      assembledChanges,
      command: "publish",
      filterPackages: ["assemble1", "@namespaced/assemble1"],
    });
    expect(scrubVfile(mergedPublishConfig)).toMatchSnapshot();
  });
});

// vfile returns fs information that is flaky between machines, scrub it
const scrubVfile = (mergedPublishConfig: any) => {
  return mergedPublishConfig.map((pkg: any) => {
    delete pkg.pkgFile.vfile;
    return pkg;
  }, mergedPublishConfig);
};
