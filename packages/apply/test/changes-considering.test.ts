import { changesConsideringParents } from "../src";
import { it } from "@effection/jest";
import mockConsole, { RestoreConsole } from "jest-mock-console";

describe("list changes considering parents", () => {
  let restoreConsole: RestoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  it("adds changes for dependency", function* () {
    const assembledChanges = {
      releases: {
        all: {
          dependencies: undefined,
          manager: "javascript",
          path: undefined,
          pkg: "all",
          type: "minor",
        },
      },
    };

    const config = {
      packages: {
        "yarn-workspace-base-pkg-a": {
          path: "./packages/pkg-a/",
          manager: "javascript",
          dependencies: ["yarn-workspace-base-pkg-b", "all"],
        },
        "yarn-workspace-base-pkg-b": {
          path: "./packages/pkg-b/",
          manager: "javascript",
          dependencies: ["all"],
        },
        all: { version: true },
      },
    };

    //@ts-ignore
    const changes = changesConsideringParents({ assembledChanges, config });

    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
      changes,
    }).toMatchSnapshot();
  });

  it("bumps patch due to dependency bump", function* () {
    const assembledChanges = {
      releases: {
        "yarn-workspace-base-pkg-a": {
          dependencies: undefined,
          manager: "javascript",
          path: undefined,
          pkg: "all",
          type: "patch",
        },
        all: {
          dependencies: undefined,
          manager: "javascript",
          path: undefined,
          pkg: "all",
          type: "minor",
        },
      },
    };

    const config = {
      packages: {
        "yarn-workspace-base-pkg-a": {
          path: "./packages/pkg-a/",
          manager: "javascript",
          dependencies: ["yarn-workspace-base-pkg-b", "all"],
        },
        "yarn-workspace-base-pkg-b": {
          path: "./packages/pkg-b/",
          manager: "javascript",
          dependencies: ["all"],
        },
        all: { version: true },
      },
    };

    //@ts-ignore
    const changes = changesConsideringParents({ assembledChanges, config });

    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
      changes,
    }).toMatchSnapshot();
  });

  it("rolls up the parent bumps", function* () {
    const changesFiles = [
      {
        releases: {
          "pkg-c": "patch",
          "pkg-d": "major",
        },
        summary:
          "This should patch bump up the pkg-[number] line to where pkg-one also receives a bump. The pkg-c writes to a patch so we patch bump up that line too.",
        meta: {},
      },
      {
        releases: {
          "pkg-b": "minor",
        },
        summary:
          "The pkg-b doesn't have a dep bump, but can dep bump pkg-a and pkg-overall with a patch.",
        meta: {},
      },
    ];

    const assembledChanges = {
      releases: {
        "pkg-b": {
          type: "minor",
          changes: [changesFiles[1]],
        },
        "pkg-c": {
          type: "patch",
          changes: [changesFiles[0]],
        },
        "pkg-d": {
          type: "major",
          changes: [changesFiles[0]],
        },
      },
    };

    const config = {
      packages: {
        "pkg-overall": {
          path: "./packages/pkg-overall/",
          manager: "javascript",
          dependencies: ["pkg-a", "pkg-b"],
        },
        "pkg-a": {
          path: "./packages/pkg-a/",
          manager: "javascript",
          dependencies: ["pkg-c"],
        },
        "pkg-b": {
          path: "./packages/pkg-b/",
          manager: "javascript",
          dependencies: [],
        },
        "pkg-c": {
          path: "./packages/pkg-c/",
          manager: "javascript",
          dependencies: ["pkg-d"],
        },
        "pkg-d": {
          path: "./packages/pkg-d/",
          manager: "javascript",
          dependencies: [],
        },
        "pkg-one": {
          path: "./packages/pkg-one/",
          manager: "javascript",
          dependencies: ["pkg-two"],
        },
        "pkg-two": {
          path: "./packages/pkg-two/",
          manager: "javascript",
          dependencies: ["pkg-three"],
        },
        "pkg-three": {
          path: "./packages/pkg-three/",
          manager: "javascript",
          dependencies: ["pkg-four"],
        },
        "pkg-four": {
          path: "./packages/pkg-four/",
          manager: "javascript",
          dependencies: ["pkg-d"],
        },
      },
    };

    //@ts-ignore
    const changes = changesConsideringParents({ assembledChanges, config });
    // console.error(changes)

    // these are directly defined in the change files
    expect(changes.releases["pkg-b"].type).toBe("minor");
    expect(changes.releases["pkg-c"].type).toBe("patch");
    expect(changes.releases["pkg-d"].type).toBe("major");

    // these are the top level rolled up
    expect(changes.releases["pkg-overall"].type).toBe("patch");
    expect(changes.releases["pkg-a"].type).toBe("patch");

    // rolls up from pkg-d
    expect(changes.releases["pkg-four"].type).toBe("patch");
    expect(changes.releases["pkg-three"].type).toBe("patch");
    expect(changes.releases["pkg-two"].type).toBe("patch");
    expect(changes.releases["pkg-one"].type).toBe("patch");

    expect({
      //@ts-ignore
      consoleLog: console.log.mock.calls,
      //@ts-ignore
      consoleDir: console.dir.mock.calls,
      changes,
    }).toMatchSnapshot();
  });
});
