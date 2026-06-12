import { validateApply } from "../src";
import { readAllPkgFiles } from "@covector/files";
import { PackageCommand, PackageFile } from "@covector/types";

import { run } from "effection";

import { describe, it, captureError } from "../../../helpers/test-scope.ts";
import { expect } from "vitest";
import pino from "pino";
import * as pinoTest from "pino-test";
import fixtures from "fixturez";
const f = fixtures(__dirname);

const configDefaults = {
  changeFolder: ".changes",
};

describe("validate apply", () => {
  it("bumps single js json", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
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

    const validated = yield validateApply({
      logger,
      // @ts-expect-error
      commands,
      config,
      cwd: jsonFolder,
    });
    expect(validated).toBe(true);
  });

  it("bumps single rust toml", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
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

    const validated = yield validateApply({
      logger,
      //@ts-expect-error
      commands,
      config,
      cwd: rustFolder,
    });
    expect(validated).toBe(true);
  });

  it("bumps multi js json", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
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

    const validated = yield validateApply({
      logger,
      //@ts-expect-error
      commands,
      config,
      cwd: jsonFolder,
    });
    expect(validated).toBe(true);
  });

  it("bumps multi rust toml", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
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

    const validated = yield validateApply({
      logger,
      //@ts-expect-error
      commands,
      config,
      cwd: rustFolder,
    });
    expect(validated).toBe(true);
  });

  it("bumps multi rust toml with object dep", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
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

    const validated = yield validateApply({
      logger,
      //@ts-expect-error
      commands,
      config,
      cwd: rustFolder,
    });
    expect(validated).toBe(true);
  });

  it("bumps multi rust toml with dep missing patch", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
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

    const validated = yield validateApply({
      logger,
      //@ts-expect-error
      commands,
      config,
      cwd: rustFolder,
    });
    expect(validated).toBe(true);
  });

  it("bumps multi rust toml as patch with object dep missing patch", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
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

    const validated = yield validateApply({
      logger,
      //@ts-expect-error
      commands,
      config,
      cwd: rustFolder,
    });
    expect(validated).toBe(true);
  });

  it("bumps multi rust toml as minor with object dep without version number (path-only)", function* () {
    // Path-only dependencies (e.g., { path = "../pkg" }) are valid in Cargo
    // for local development and should not cause an error
    const stream = pinoTest.sink();
    const logger = pino(stream);

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

    const validated = yield validateApply({
      logger,
      commands,
      config,
      cwd: rustFolder,
    });
    expect(validated).toBe(true);
  });
});
