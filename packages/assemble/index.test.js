const { assemble, mergeIntoConfig } = require("./index");

describe("assemble changes", () => {
  const testTextOne = `
---
"assemble1": patch
"assemble2": patch
---
    
This is a test.
`;
  const testTextTwo = `
---
"assemble1": minor
"assemble2": patch
---
    
This is a test.
`;
  const testTextThree = `
---
"assemble1": patch
"assemble2": major
---
    
This is a test.
`;
  const testTextFour = `
---
"assemble1": patch
"@namespaced/assemble2": patch
---
    
This is a test.
`;

  it("runs", () => {
    const assembled = assemble([
      testTextOne,
      testTextTwo,
      testTextThree,
      testTextFour,
    ]);
    expect(assembled).toMatchSnapshot();
  });
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
    },
    assemble2: {
      path: "./packages/assemble2",
      version: "lerna version ${ release.type }",
    },
    "@namespaced/assemble1": {
      path: "./packages/namespaced-assemble2",
      manager: "cargo",
      version: "cargo version ${ release.type }",
      publish: "cargo publish",
      dependencies: ["assemble1"],
    },
    "@namespaced/assemble2": {
      path: "./packages/namespaced-assemble2",
      manager: "cargo",
      version: "cargo version ${ release.type }",
      publish: "cargo publish",
      dependencies: ["assemble2"],
    },
  },
};

describe("merge config test", () => {
  it("merges version", async () => {
    const mergedVersionConfig = await mergeIntoConfig({
      config,
      assembledChanges,
      command: "version",
    });
    expect(mergedVersionConfig).toMatchSnapshot();
  });

  it("merges version without command", async () => {
    let modifiedConfig = { ...config };
    delete modifiedConfig.pkgManagers.javascript.version;
    delete modifiedConfig.packages["assemble2"].version;
    delete modifiedConfig.packages["@namespaced/assemble1"].version;
    delete modifiedConfig.packages["@namespaced/assemble2"].version;

    const mergedVersionConfig = await mergeIntoConfig({
      config: modifiedConfig,
      assembledChanges,
      command: "version",
    });
    expect(mergedVersionConfig).toMatchSnapshot();
  });

  it("merges nested bumps", async () => {
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

    const mergedVersionConfig = await mergeIntoConfig({
      config: nestedConfig,
      assembledChanges: nestedAssembledChanges,
      command: "version",
    });
    expect(mergedVersionConfig).toMatchSnapshot();
  });

  it("merges publish", async () => {
    // const mergedPublishConfig = await mergeIntoConfig({
    //   config,
    //   assembledChanges,
    //   command: "publish",
    // });
    // expect(mergedPublishConfig).toMatchSnapshot();
  });
});
