import { validateApply } from "../src";
import { run } from "effection";
import { captureError, it } from "@effection/jest";
import mockConsole from "jest-mock-console";
import fixtures from "fixturez";
import { PackageCommand, PackageFile } from "@covector/types";
import { readAllPkgFiles } from "@covector/files";
const f = fixtures(__dirname);

const configDefaults = {
  changeFolder: ".changes",
};

describe("validate apply", () => {
  it("bumps single js json", function* () {
    const jsonFolder = f.copy("pkg.js-single-json");

    const commands = [
      {
        dependencies: undefined,
        manager: "javascript",
        path: "./",
        pkg: "js-single-json-fixture",
        type: "minor",
        parents: [],
      },
    ];

    const config = {
      packages: {
        "js-single-json-fixture": {
          path: "./",
          manager: "javascript",
        },
      },
    };

    expect.assertions(1);
    expect(
      async () =>
        //@ts-expect-error
        await run(validateApply({ commands, config, cwd: jsonFolder })),
    ).not.toThrow();
  });

  it("bumps single rust toml", function* () {
    const rustFolder = f.copy("pkg.rust-single");

    const commands = [
      {
        dependencies: undefined,
        manager: "rust",
        path: "./",
        pkg: "rust-single-fixture",
        type: "minor",
        parents: [],
      },
    ];

    const config = {
      packages: {
        "rust-single-fixture": {
          path: "./",
          manager: "rust",
        },
      },
    };

    expect.assertions(1);
    expect(
      //@ts-expect-error
      async () => await validateApply({ commands, config, cwd: rustFolder }),
    ).not.toThrow();
  });

  it("bumps multi js json", function* () {
    const jsonFolder = f.copy("pkg.js-yarn-workspace");

    const commands = [
      {
        dependencies: ["yarn-workspace-base-pkg-b", "all"],
        manager: "javascript",
        path: "./",
        pkg: "yarn-workspace-base-pkg-a",
        type: "minor",
        parents: [],
      },
      {
        dependencies: undefined,
        manager: "javascript",
        path: undefined,
        pkg: "yarn-workspace-base-pkg-b",
        type: "minor",
        parents: ["yarn-workspace-base-pkg-a"],
      },
      {
        dependencies: undefined,
        manager: "javascript",
        path: undefined,
        pkg: "all",
        type: "minor",
        parents: ["yarn-workspace-base-pkg-a", "yarn-workspace-base-pkg-b"],
      },
    ];

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

    expect.assertions(1);
    expect(
      //@ts-expect-error
      async () => await validateApply({ commands, config, cwd: jsonFolder }),
    ).not.toThrow();
  });

  it("bumps multi rust toml", function* () {
    const rustFolder = f.copy("pkg.rust-multi");

    const commands = [
      {
        dependencies: ["rust_pkg_b_fixture"],
        manager: "rust",
        path: "./pkg-a/",
        pkg: "rust_pkg_a_fixture",
        type: "minor",
        parents: [],
      },
      {
        dependencies: undefined,
        manager: "rust",
        path: "./pkg-b/",
        pkg: "rust_pkg_b_fixture",
        type: "minor",
        parents: [],
      },
    ];

    const config = {
      packages: {
        rust_pkg_a_fixture: {
          path: "./pkg-a/",
          manager: "rust",
        },
        rust_pkg_b_fixture: {
          path: "./pkg-b/",
          manager: "rust",
        },
      },
    };

    expect.assertions(1);
    expect(
      //@ts-expect-error
      async () => await validateApply({ commands, config, cwd: rustFolder }),
    ).not.toThrow();
  });

  it("bumps multi rust toml with object dep", function* () {
    const rustFolder = f.copy("pkg.rust-multi-object-dep");

    const commands = [
      {
        dependencies: ["rust_pkg_b_fixture"],
        manager: "rust",
        path: "./pkg-a/",
        pkg: "rust_pkg_a_fixture",
        type: "minor",
        parents: [],
      },
      {
        dependencies: undefined,
        manager: "rust",
        path: "./pkg-b/",
        pkg: "rust_pkg_b_fixture",
        type: "minor",
        parents: [],
      },
    ];

    const config = {
      packages: {
        rust_pkg_a_fixture: {
          path: "./pkg-a/",
          manager: "rust",
        },
        rust_pkg_b_fixture: {
          path: "./pkg-b/",
          manager: "rust",
        },
      },
    };

    expect.assertions(1);
    expect(
      //@ts-expect-error
      async () => await validateApply({ commands, config, cwd: rustFolder }),
    ).not.toThrow();
  });

  it("bumps multi rust toml with dep missing patch", function* () {
    const rustFolder = f.copy("pkg.rust-multi-no-patch-dep");

    const commands = [
      {
        dependencies: ["rust_pkg_b_fixture"],
        manager: "rust",
        path: "./pkg-a/",
        pkg: "rust_pkg_a_fixture",
        type: "minor",
        parents: [],
      },
      {
        dependencies: undefined,
        manager: "rust",
        path: "./pkg-b/",
        pkg: "rust_pkg_b_fixture",
        type: "minor",
        parents: [],
      },
    ];

    const config = {
      packages: {
        rust_pkg_a_fixture: {
          path: "./pkg-a/",
          manager: "rust",
        },
        rust_pkg_b_fixture: {
          path: "./pkg-b/",
          manager: "rust",
        },
      },
    };

    expect.assertions(1);
    expect(
      //@ts-expect-error
      async () => await validateApply({ commands, config, cwd: rustFolder }),
    ).not.toThrow();
  });

  it("bumps multi rust toml as patch with object dep missing patch", function* () {
    const rustFolder = f.copy("pkg.rust-multi-object-no-patch-dep");

    const commands = [
      {
        dependencies: ["rust_pkg_b_fixture"],
        manager: "rust",
        path: "./pkg-a/",
        pkg: "rust_pkg_a_fixture",
        type: "patch",
        parents: [],
      },
      {
        dependencies: undefined,
        manager: "rust",
        path: "./pkg-b/",
        pkg: "rust_pkg_b_fixture",
        type: "patch",
        parents: [],
      },
    ];

    const config = {
      ...configDefaults,
      packages: {
        rust_pkg_a_fixture: {
          path: "./pkg-a/",
          manager: "rust",
        },
        rust_pkg_b_fixture: {
          path: "./pkg-b/",
          manager: "rust",
        },
      },
    };

    expect.assertions(1);
    const validated = yield validateApply({
      //@ts-expect-error
      commands,
      config,
      cwd: rustFolder,
    });
    expect(validated).toBe(true);
  });

  it("bumps multi rust toml as minor with object dep without version number", function* () {
    let restoreConsole = mockConsole(["error"]);

    const rustFolder: string = f.copy("pkg.rust-multi-object-path-dep-only");

    const config = {
      packages: {
        rust_pkg_a_fixture: {
          path: "./pkg-a/",
          manager: "rust",
        },
        rust_pkg_b_fixture: {
          path: "./pkg-b/",
          manager: "rust",
        },
      },
    };
    const allPackages: Record<string, PackageFile> = yield readAllPkgFiles({
      config,
      cwd: rustFolder,
    });

    const commands: PackageCommand[] = [
      {
        dependencies: ["rust_pkg_b_fixture"],
        manager: "rust",
        path: "./pkg-a/",
        pkg: "rust_pkg_a_fixture",
        type: "minor",
        parents: {},
      },
      {
        dependencies: undefined,
        manager: "rust",
        path: "./pkg-b/",
        pkg: "rust_pkg_b_fixture",
        type: "minor",
        parents: {},
      },
    ];

    const errored = yield captureError(
      validateApply({
        commands,
        allPackages,
      }),
    );
    expect(errored.message).toMatch(
      "rust_pkg_a_fixture has a dependency on rust_pkg_b_fixture, and rust_pkg_b_fixture does not have a version number. " +
        "This cannot be published. Please pin it to a MAJOR.MINOR.PATCH reference.",
    );

    expect({
      //@ts-expect-error
      consoleError: console.error.mock.calls,
    }).toMatchSnapshot();

    restoreConsole();
  });
});
