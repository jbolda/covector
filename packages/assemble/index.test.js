const { assemble, mergeIntoConfig, removeSameGraphBumps } = require("./index");

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

describe("merge config test", () => {
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
        version:
          "lerna version ${ release.type } --no-git-tag-version --no-push",
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

  it("merges publish", async () => {
    // const mergedPublishConfig = await mergeIntoConfig({
    //   config,
    //   assembledChanges,
    //   command: "publish",
    // });
    // expect(mergedPublishConfig).toMatchSnapshot();
  });
});

describe("removes graph bumps test", () => {
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

  const mergedChanges = [
    {
      path: "./packages/namespaced-assemble2",
      pkg: "@namespaced/assemble2",
      type: "patch",
      version: "cargo version patch",
    },
    {
      path: "./packages/assemble1",
      pkg: "assemble1",
      type: "minor",
      version: "lerna version minor",
    },
    {
      path: "./packages/assemble2",
      pkg: "assemble2",
      type: "major",
      version: "lerna version major",
    },
  ];

  const config = {
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

  it("returns with graph bumps removed version", () => {
    const trimmedVersionBumps = removeSameGraphBumps({
      mergedChanges,
      assembledChanges,
      config,
      command: "version",
    });
    // console.log(trimmedVersionBumps);
    // expect(mergedVersionConfig).toMatchSnapshot();
  });

  it("returns with graph bumps removed merges publish", () => {
    const trimmedPublishBumps = removeSameGraphBumps({
      mergedChanges,
      assembledChanges,
      config,
      command: "publish",
    });
    // expect(mergedPublishConfig).toMatchSnapshot();
  });
});
