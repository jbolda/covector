import { it } from "@effection/jest";
import { mergeIntoConfig, mergeChangesToConfig } from "../src";
import fixtures from "fixturez";
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

describe("merge config", () => {
  describe("full config", () => {
    it("merges version", function* () {
      const mergedVersionConfig = yield mergeChangesToConfig({
        config,
        assembledChanges,
        command: "version",
        cwd: ".",
      });
      expect(mergedVersionConfig).toMatchSnapshot();
    });

    it("merges version without command", function* () {
      let modifiedConfig = { ...config };
      //@ts-expect-error
      delete modifiedConfig.pkgManagers.javascript.version;
      //@ts-expect-error
      delete modifiedConfig.packages["assemble2"].version;
      //@ts-expect-error
      delete modifiedConfig.packages["@namespaced/assemble1"].version;
      //@ts-expect-error
      delete modifiedConfig.packages["@namespaced/assemble2"].version;

      const mergedVersionConfig = yield mergeChangesToConfig({
        config: modifiedConfig,
        assembledChanges,
        command: "version",
        cwd: ".",
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

      const mergedVersionConfig = yield mergeChangesToConfig({
        config: nestedConfig,
        assembledChanges: nestedAssembledChanges,
        command: "version",
        cwd: ".",
      });
      expect(mergedVersionConfig).toMatchSnapshot();
    });

    it("merges publish", function* () {
      const configFolder = f.copy("assemble");

      const mergedPublishConfig = yield mergeIntoConfig({
        cwd: configFolder,
        config,
        assembledChanges: [] as any,
        command: "publish",
      });
      expect(mergedPublishConfig).toMatchSnapshot();
    });
  });

  describe("filtered config", () => {
    it("merges version", function* () {
      const mergedVersionConfig = yield mergeChangesToConfig({
        config,
        assembledChanges,
        command: "version",
        filterPackages: ["assemble1", "@namespaced/assemble1"],
        cwd: ".",
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
      expect(mergedPublishConfig).toMatchSnapshot();
    });
  });
});
