const { assemble, mergeIntoConfig } = require("./index");
const fixtures = require("fixturez");
const f = fixtures(__dirname);

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
  contents: `
---
"assemble1": patch
"assemble2": patch
---
    
This is a test.
`,
};
const testTextTwo = {
  contents: `
---
"assemble1": minor
"assemble2": patch
---
    
This is a test.
`,
};
const testTextThree = {
  contents: `
---
"assemble1": patch
"assemble2": major
---
    
This is a test.
`,
};
const testTextFour = {
  contents: `
---
"assemble1": patch
"@namespaced/assemble2": patch
---
    
This is a test. We might link out to a [website](https://www.jacobbolda.com).
`,
};
const testTextFive = {
  contents: `
---
"all": minor
---
  
This is a test.
`,
};
const testTextSpecialOne = {
  contents: `
---
"assemble1": housekeeping
"assemble2": workflows
---
  
This is a test.
`,
};
const testTextSpecialTwo = {
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
  it("runs", function* () {
    const assembled = yield assemble({
      vfiles: [testTextOne, testTextTwo, testTextThree, testTextFour],
    });
    expect(assembled).toMatchSnapshot();
  });

  it("assembles deps", function* () {
    const assembled = yield assemble({ vfiles: [testTextFive] });
    expect(assembled).toMatchSnapshot();
  });
});

describe("special bump types", () => {
  it("valid additional bump types", function* () {
    const assembled = yield assemble({
      vfiles: [
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
        config,
      });
    } catch (e) {
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
        vfiles: [testTextSpecialTwo],
        config: configSpecial,
      });
    } catch (e) {
      expect(e.message).toMatch(
        "explosions specified for @namespaced/assemble2 is invalid.\n" +
          "Try one of the following: major, minor, patch, housekeeping, workflows.\n"
      );
    }
  });

  it("handles an only noop", function* () {
    const assembled = yield assemble({
      vfiles: [testTextSpecialOne],
      config: configSpecial,
    });
    expect(assembled).toMatchSnapshot();
  });
});

describe("merge config test", () => {
  it("merges version", function* () {
    const mergedVersionConfig = yield mergeIntoConfig({
      config,
      assembledChanges,
      command: "version",
    });
    expect(mergedVersionConfig).toMatchSnapshot();
  });

  it("merges version without command", function* () {
    let modifiedConfig = { ...config };
    delete modifiedConfig.pkgManagers.javascript.version;
    delete modifiedConfig.packages["assemble2"].version;
    delete modifiedConfig.packages["@namespaced/assemble1"].version;
    delete modifiedConfig.packages["@namespaced/assemble2"].version;

    const mergedVersionConfig = yield mergeIntoConfig({
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

    const mergedVersionConfig = yield mergeIntoConfig({
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
      config,
      assembledChanges: [],
      command: "publish",
    });
    expect(scrubVfile(mergedPublishConfig)).toMatchSnapshot();
  });
});

describe("merge filtered config test", () => {
  it("merges version", function* () {
    const mergedVersionConfig = yield mergeIntoConfig({
      config,
      assembledChanges,
      command: "version",
      filterPackages: ["assemble1", "@namespaced/assemble1"],
    });
    expect(mergedVersionConfig).toMatchSnapshot();
  });

  it("merges publish", function* () {
    const configFolder = f.copy("assemble");

    const mergedPublishConfig = yield mergeIntoConfig({
      cwd: configFolder,
      config,
      assembledChanges,
      command: "publish",
      filterPackages: ["assemble1", "@namespaced/assemble1"],
    });
    expect(scrubVfile(mergedPublishConfig)).toMatchSnapshot();
  });
});

// vfile returns fs information that is flaky between machines, scrub it
const scrubVfile = (mergedPublishConfig) => {
  return mergedPublishConfig.map((pkg) => {
    delete pkg.pkgFile.vfile;
    return pkg;
  }, mergedPublishConfig);
};
