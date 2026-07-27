import { apply } from "../src";
import { CommonBumps } from "@covector/types";
import { loadFile, readAllPkgFiles } from "@covector/files";
import { describe, it, captureError } from "@effectionx/vitest";
import { expect } from "vitest";
import * as logTest from "../../../helpers/test-logger.ts";
// @ts-expect-error has no types
import fixtures from "fixturez";
import { logger } from "../../covector/src/logger.ts";
const f = fixtures(__dirname);

const configDefaults = {
  changeFolder: ".changes",
};

describe("package file apply bump (snapshot)", () => {
  describe("on js", () => {
    it("bumps single", function* () {
      const log = yield* logTest.useCapturedLogger();
        const jsonFolder = f.copy("pkg.js-single-json");

      const commands = [
        {
          dependencies: undefined,
          manager: "javascript",
          path: "./",
          pkg: "js-single-json-fixture",
          type: "minor",
          parents: {},
        },
      ];

      const config = {
        ...configDefaults,
        packages: {
          "js-single-json-fixture": {
            path: "./",
            manager: "javascript",
          },
        },
      };

      const allPackages = yield* readAllPkgFiles({ config, cwd: jsonFolder });

      yield* apply({
        logger: logger.operations,
        //@ts-expect-error
        commands,
        config,
        allPackages,
        cwd: jsonFolder,
      });
      const modifiedFile = yield* loadFile("package.json", jsonFolder);
      expect(modifiedFile.content).toBe(
        "{\n" +
          '  "private": true,\n' +
          '  "name": "js-single-json-fixture",\n' +
          '  "description": "A single package at the root. No monorepo setup.",\n' +
          '  "repository": "https://www.github.com/jbolda/covector.git",\n' +
          '  "version": "0.6.0"\n' +
          "}\n",
      );

      yield* logTest.consecutive(log.all, [
          { msg: "bumping js-single-json-fixture with minor", level: "info" },
        ]);
    });

    it("fails bump single that satisfies range", function* () {
      const log = yield* logTest.useCapturedLogger();
        const jsonFolder = f.copy("pkg.js-single-json");

      const commands = [
        {
          dependencies: undefined,
          manager: "javascript",
          path: "./",
          pkg: "js-single-json-fixture",
          type: "minor",
          parents: {},
          errorOnVersionRange: ">= 0.6.0",
        },
      ];

      const config = {
        ...configDefaults,
        packages: {
          "js-single-json-fixture": {
            path: "./",
            manager: "javascript",
          },
        },
      };

      const allPackages = yield* readAllPkgFiles({ config, cwd: jsonFolder });
      const applied = yield* captureError(
        apply({
          logger: logger.operations,
          //@ts-expect-error
          commands,
          config,
          allPackages,
          cwd: jsonFolder,
        }),
      );
      expect(applied.message).toBe(
        "js-single-json-fixture will be bumped to 0.6.0. This satisfies the range >= 0.6.0 which the configuration disallows. Please adjust your bump to accommodate the range or otherwise adjust the allowed range in `errorOnVersionRange`.",
      );

      yield* logTest.consecutive(log.all, [
          { msg: "bumping js-single-json-fixture with minor", level: "info" },
        ]);
    });

    it("bumps multi", function* () {
      const log = yield* logTest.useCapturedLogger();
        const jsonFolder = f.copy("pkg.js-yarn-workspace");

      const commands = [
        {
          dependencies: ["yarn-workspace-base-pkg-b", "all"],
          manager: "javascript",
          path: "./",
          pkg: "yarn-workspace-base-pkg-a",
          type: "minor",
          parents: {},
        },
        {
          dependencies: undefined,
          manager: "javascript",
          path: undefined,
          pkg: "yarn-workspace-base-pkg-b",
          type: "minor",
          parents: { "yarn-workspace-base-pkg-a": "null" },
        },
        {
          dependencies: undefined,
          manager: "javascript",
          path: undefined,
          pkg: "all",
          type: "minor",
          parents: {
            "yarn-workspace-base-pkg-a": "null",
            "yarn-workspace-base-pkg-b": "null",
          },
        },
      ];

      const config = {
        ...configDefaults,
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

      const allPackages = yield* readAllPkgFiles({ config, cwd: jsonFolder });

      yield* apply({
        logger: logger.operations,
        //@ts-expect-error
        commands,
        config,
        allPackages,
        cwd: jsonFolder,
      });
      const modifiedPkgAFile = yield* loadFile(
        "packages/pkg-a/package.json",
        jsonFolder,
      );
      expect(modifiedPkgAFile.content).toBe(
        "{\n" +
          '  "name": "yarn-workspace-base-pkg-a",\n' +
          '  "version": "1.1.0",\n' +
          '  "dependencies": {\n' +
          '    "yarn-workspace-base-pkg-b": "1.1.0"\n' +
          "  }\n" +
          "}\n",
      );

      const modifiedPkgBFile = yield* loadFile(
        "packages/pkg-b/package.json",
        jsonFolder,
      );
      expect(modifiedPkgBFile.content).toBe(
        "{\n" +
          '  "name": "yarn-workspace-base-pkg-b",\n' +
          '  "version": "1.1.0"\n' +
          "}\n",
      );

      yield* logTest.consecutive(log.all, [
          { msg: "bumping yarn-workspace-base-pkg-a with minor", level: "info" },
          { msg: "bumping yarn-workspace-base-pkg-b with minor", level: "info" },
          { msg: "bumping all with minor", level: "info" },
        ]);
    });

    it("bumps multi with pnpm workspace protocol deps", function* () {
      const log = yield* logTest.useCapturedLogger();
      const jsonFolder = f.copy("pkg.js-pnpm-workspace");

      const commands = [
        {
          dependencies: ["pnpm-workspace-pkg-b", "pnpm-workspace-pkg-c"],
          manager: "javascript",
          path: "./packages/pkg-a/",
          pkg: "pnpm-workspace-pkg-a",
          type: "minor",
          parents: {},
        },
        {
          dependencies: undefined,
          manager: "javascript",
          path: "./packages/pkg-b/",
          pkg: "pnpm-workspace-pkg-b",
          type: "minor",
          parents: {},
        },
        {
          dependencies: ["pnpm-workspace-pkg-b"],
          manager: "javascript",
          path: "./packages/pkg-c/",
          pkg: "pnpm-workspace-pkg-c",
          type: "minor",
          parents: {},
        },
      ];

      const config = {
        ...configDefaults,
        packages: {
          "pnpm-workspace-pkg-a": {
            path: "./packages/pkg-a/",
            manager: "javascript",
            dependencies: ["pnpm-workspace-pkg-b", "pnpm-workspace-pkg-c"],
          },
          "pnpm-workspace-pkg-b": {
            path: "./packages/pkg-b/",
            manager: "javascript",
          },
          "pnpm-workspace-pkg-c": {
            path: "./packages/pkg-c/",
            manager: "javascript",
            dependencies: ["pnpm-workspace-pkg-b"],
          },
        },
      };

      const allPackages = yield* readAllPkgFiles({ config, cwd: jsonFolder });

      yield* apply({
        logger: logger.operations,
        //@ts-expect-error
        commands,
        config,
        allPackages,
        cwd: jsonFolder,
      });

      // `workspace:*` and `workspace:~` deps resolve to whatever version the
      // workspace holds and get rewritten by the package manager at publish,
      // so the declarations survive the bump byte-for-byte
      const modifiedPkgAFile = yield* loadFile(
        "packages/pkg-a/package.json",
        jsonFolder,
      );
      expect(modifiedPkgAFile.content).toBe(
        "{\n" +
          '  "name": "pnpm-workspace-pkg-a",\n' +
          '  "version": "1.1.0",\n' +
          '  "dependencies": {\n' +
          '    "pnpm-workspace-pkg-b": "workspace:*"\n' +
          "  },\n" +
          '  "devDependencies": {\n' +
          '    "pnpm-workspace-pkg-c": "workspace:~"\n' +
          "  }\n" +
          "}\n",
      );

      // an embedded range keeps the protocol prefix and bumps within it
      const modifiedPkgCFile = yield* loadFile(
        "packages/pkg-c/package.json",
        jsonFolder,
      );
      expect(modifiedPkgCFile.content).toBe(
        "{\n" +
          '  "name": "pnpm-workspace-pkg-c",\n' +
          '  "version": "1.1.0",\n' +
          '  "dependencies": {\n' +
          '    "pnpm-workspace-pkg-b": "workspace:^1.1.0"\n' +
          "  }\n" +
          "}\n",
      );

      const modifiedPkgBFile = yield* loadFile(
        "packages/pkg-b/package.json",
        jsonFolder,
      );
      expect(modifiedPkgBFile.content).toBe(
        "{\n" +
          '  "name": "pnpm-workspace-pkg-b",\n' +
          '  "version": "1.1.0"\n' +
          "}\n",
      );

      yield* logTest.consecutive(log.all, [
        { msg: "bumping pnpm-workspace-pkg-a with minor", level: "info" },
        { msg: "bumping pnpm-workspace-pkg-b with minor", level: "info" },
        { msg: "bumping pnpm-workspace-pkg-c with minor", level: "info" },
      ]);
    });

    it("bumps multi with pnpm catalog deps", function* () {
      const log = yield* logTest.useCapturedLogger();
      const jsonFolder = f.copy("pkg.js-pnpm-catalog");

      const commands = [
        {
          dependencies: ["js-catalog-pkg-b", "js-catalog-pkg-c"],
          manager: "javascript",
          path: "./packages/pkg-a/",
          pkg: "js-catalog-pkg-a",
          type: "minor",
          parents: {},
        },
        {
          dependencies: undefined,
          manager: "javascript",
          path: "./packages/pkg-b/",
          pkg: "js-catalog-pkg-b",
          type: "minor",
          parents: {},
        },
        {
          dependencies: undefined,
          manager: "javascript",
          path: "./packages/pkg-c/",
          pkg: "js-catalog-pkg-c",
          type: "minor",
          parents: {},
        },
      ];

      const config = {
        ...configDefaults,
        packages: {
          "js-catalog-pkg-a": {
            path: "./packages/pkg-a/",
            manager: "javascript",
            dependencies: ["js-catalog-pkg-b", "js-catalog-pkg-c"],
          },
          "js-catalog-pkg-b": {
            path: "./packages/pkg-b/",
            manager: "javascript",
          },
          "js-catalog-pkg-c": {
            path: "./packages/pkg-c/",
            manager: "javascript",
          },
        },
      };

      const allPackages = yield* readAllPkgFiles({ config, cwd: jsonFolder });
      const originalWorkspaceFile = yield* loadFile(
        "pnpm-workspace.yaml",
        jsonFolder,
      );

      yield* apply({
        logger: logger.operations,
        //@ts-expect-error
        commands,
        config,
        allPackages,
        cwd: jsonFolder,
      });

      // a `catalog:` reference points at a range kept in pnpm-workspace.yaml
      // and is rewritten by pnpm at publish time, so the declaration itself
      // must survive a cascade bump byte-for-byte
      const modifiedPkgAFile = yield* loadFile(
        "packages/pkg-a/package.json",
        jsonFolder,
      );
      expect(modifiedPkgAFile.content).toBe(
        "{\n" +
          '  "name": "js-catalog-pkg-a",\n' +
          '  "version": "1.1.0",\n' +
          '  "dependencies": {\n' +
          '    "react": "catalog:",\n' +
          '    "js-catalog-pkg-b": "catalog:"\n' +
          "  },\n" +
          '  "devDependencies": {\n' +
          '    "js-catalog-pkg-c": "catalog:tools"\n' +
          "  }\n" +
          "}\n",
      );

      // the catalog tables are managed manually (pnpm does not document
      // catalog entries for workspace-internal packages), so the workspace
      // manifest is never rewritten: it survives byte-for-byte as checked
      // out, line endings included
      const modifiedWorkspaceFile = yield* loadFile(
        "pnpm-workspace.yaml",
        jsonFolder,
      );
      expect(modifiedWorkspaceFile.content).toBe(originalWorkspaceFile.content);

      yield* logTest.consecutive(log.all, [
        { msg: "bumping js-catalog-pkg-a with minor", level: "info" },
        { msg: "bumping js-catalog-pkg-b with minor", level: "info" },
        { msg: "bumping js-catalog-pkg-c with minor", level: "info" },
      ]);
    });

    it("bumps multi with parent as range", function* () {
      const log = yield* logTest.useCapturedLogger();
        const jsonFolder = f.copy("pkg.js-yarn-workspace");

      const commands = [
        {
          dependencies: ["yarn-workspace-base-pkg-b"],
          manager: "javascript",
          path: "",
          pkg: "yarn-workspace-base-pkg-a",
          type: "patch" as CommonBumps,
          parents: {},
        },
        {
          dependencies: [],
          manager: "javascript",
          path: "",
          pkg: "yarn-workspace-base-pkg-b",
          type: "minor" as CommonBumps,
          parents: [
            {
              "yarn-workspace-base-pkg-a": {
                type: "dependencies",
                version: "null",
              },
            },
          ],
        },
      ];

      const config = {
        ...configDefaults,
        packages: {
          "yarn-workspace-base-pkg-a": {
            path: "./packages/pkg-a/",
            manager: "javascript",
            dependencies: ["yarn-workspace-base-pkg-b"],
          },
          "yarn-workspace-base-pkg-b": {
            path: "./packages/pkg-b/",
            manager: "javascript",
          },
          "yarn-workspace-base-pkg-c": {
            path: "./packages/pkg-b/",
            manager: "javascript",
            dependencies: ["yarn-workspace-base-pkg-b"],
          },
        },
      };

      const allPackages = yield* readAllPkgFiles({ config, cwd: jsonFolder });

      yield* apply({
        logger: logger.operations,
        // @ts-expect-error
        commands,
        config,
        allPackages,
        cwd: jsonFolder,
      });

      const modifiedPkgBFile = yield* loadFile(
        "packages/pkg-b/package.json",
        jsonFolder,
      );
      expect(modifiedPkgBFile.content).toBe(
        "{\n" +
          '  "name": "yarn-workspace-base-pkg-b",\n' +
          '  "version": "1.1.0"\n' +
          "}\n",
      );

      // this is an exact version dep which will be patch bumped
      const modifiedPkgAFile = yield* loadFile(
        "packages/pkg-a/package.json",
        jsonFolder,
      );
      expect(modifiedPkgAFile.content).toBe(
        "{\n" +
          '  "name": "yarn-workspace-base-pkg-a",\n' +
          '  "version": "1.0.1",\n' +
          '  "dependencies": {\n' +
          '    "yarn-workspace-base-pkg-b": "1.1.0"\n' +
          "  }\n" +
          "}\n",
      );

      // this is a range dep which will not be patch bumped
      const modifiedPkgCFile = yield* loadFile(
        "packages/pkg-c/package.json",
        jsonFolder,
      );

      expect(modifiedPkgCFile.content).toEqual(
        "{\n" +
          '  "name": "yarn-workspace-base-pkg-c",\n' +
          '  "version": "1.0.0",\n' +
          '  "dependencies": {\n' +
          '    "yarn-workspace-base-pkg-b": "^1.0.0"\n' +
          "  }\n" +
          "}\n",
      );

      yield* logTest.consecutive(log.all, [
          { msg: "bumping yarn-workspace-base-pkg-a with patch", level: "info" },
          { msg: "bumping yarn-workspace-base-pkg-b with minor", level: "info" },
        ]);
    });
  });

  describe("on rust", () => {
    it("bumps single", function* () {
      const log = yield* logTest.useCapturedLogger();
        const rustFolder = f.copy("pkg.rust-single");

      const commands = [
        {
          dependencies: undefined,
          manager: "rust",
          path: "./",
          pkg: "rust-single-fixture",
          type: "minor" as CommonBumps,
          parents: {},
        },
      ];

      const config = {
        ...configDefaults,
        packages: {
          "rust-single-fixture": {
            path: "./",
            manager: "rust",
          },
        },
      };

      const allPackages = yield* readAllPkgFiles({ config, cwd: rustFolder });

      // @ts-expect-error
      yield* apply({
        logger: logger.operations,
        commands,
        allPackages,
        cwd: rustFolder,
      });
      const modifiedFile = yield* loadFile("Cargo.toml", rustFolder);
      expect(modifiedFile.content).toBe(
        '[package]\nname = "rust-single-fixture"\nversion = "0.6.0"\n',
      );

      yield* logTest.consecutive(log.all, [
          { msg: "bumping rust-single-fixture with minor", level: "info" },
        ]);
    });

    it("fails bumps single that satisfies range", function* () {
      const log = yield* logTest.useCapturedLogger();
        const rustFolder = f.copy("pkg.rust-single");

      const commands = [
        {
          dependencies: undefined,
          manager: "rust",
          path: "./",
          pkg: "rust-single-fixture",
          type: "minor",
          parents: {},
          errorOnVersionRange: ">= 0.6.0",
        },
      ];

      const config = {
        ...configDefaults,
        packages: {
          "rust-single-fixture": {
            path: "./",
            manager: "rust",
          },
        },
      };

      const allPackages = yield* readAllPkgFiles({ config, cwd: rustFolder });

      const applied = yield* captureError(
        apply({
          logger: logger.operations,
          //@ts-expect-error
          commands,
          config,
          allPackages,
          cwd: rustFolder,
        }),
      );
      expect(applied.message).toBe(
        "rust-single-fixture will be bumped to 0.6.0. This satisfies the range >= 0.6.0 which the configuration disallows. Please adjust your bump to accommodate the range or otherwise adjust the allowed range in `errorOnVersionRange`.",
      );

      yield* logTest.consecutive(log.all, [
          { msg: "bumping rust-single-fixture with minor", level: "info" },
        ]);
    });

    it("bumps multi", function* () {
      const log = yield* logTest.useCapturedLogger();
        const rustFolder = f.copy("pkg.rust-multi");

      const commands = [
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

      const allPackages = yield* readAllPkgFiles({ config, cwd: rustFolder });

      yield* apply({
        logger: logger.operations,
        //@ts-expect-error
        commands,
        config,
        allPackages,
        cwd: rustFolder,
      });

      const modifiedAPKGFile = yield* loadFile("pkg-a/Cargo.toml", rustFolder);
      expect(modifiedAPKGFile.content).toBe(
        "[package]\n" +
          'name = "rust_pkg_a_fixture"\n' +
          'version = "0.6.0"\n' +
          "\n" +
          "[dependencies]\n" +
          'rust_pkg_b_fixture = "0.9.0"\n',
      );

      const modifiedBPKGFile = yield* loadFile("pkg-b/Cargo.toml", rustFolder);
      expect(modifiedBPKGFile.content).toBe(
        "[package]\n" + 'name = "rust_pkg_b_fixture"\n' + 'version = "0.9.0"\n',
      );

      yield* logTest.consecutive(log.all, [
          { msg: "bumping rust_pkg_a_fixture with minor", level: "info" },
          { msg: "bumping rust_pkg_b_fixture with minor", level: "info" },
        ]);
    });

    it("bumps multi with workspace inherited dep", function* () {
      const log = yield* logTest.useCapturedLogger();
      const rustFolder = f.copy("pkg.rust-workspace-deps");

      const commands = [
        {
          dependencies: ["rust_workspace_pkg_b_fixture"],
          manager: "rust",
          path: "./pkg-a/",
          pkg: "rust_workspace_dep_fixture",
          type: "minor",
          parents: {},
        },
        {
          dependencies: undefined,
          manager: "rust",
          path: "./pkg-b/",
          pkg: "rust_workspace_pkg_b_fixture",
          type: "minor",
          parents: {},
        },
      ];

      const config = {
        ...configDefaults,
        packages: {
          rust_workspace_dep_fixture: {
            path: "./pkg-a/",
            manager: "rust",
          },
          rust_workspace_pkg_b_fixture: {
            path: "./pkg-b/",
            manager: "rust",
          },
        },
      };

      const allPackages = yield* readAllPkgFiles({ config, cwd: rustFolder });

      yield* apply({
        logger: logger.operations,
        //@ts-expect-error
        commands,
        config,
        allPackages,
        cwd: rustFolder,
      });

      // the version of a `{ workspace = true }` dependency lives in the
      // workspace root manifest, so the member manifest is left untouched
      // aside from its own version bump
      const modifiedAPKGFile = yield* loadFile("pkg-a/Cargo.toml", rustFolder);
      expect(modifiedAPKGFile.content).toBe(
        "[package]\n" +
          'name = "rust_workspace_dep_fixture"\n' +
          'version = "0.6.0"\n' +
          "\n" +
          "[dependencies]\n" +
          "serde = { workspace = true }\n" +
          "rust_workspace_pkg_b_fixture = { workspace = true }\n",
      );

      const modifiedBPKGFile = yield* loadFile("pkg-b/Cargo.toml", rustFolder);
      expect(modifiedBPKGFile.content).toBe(
        "[package]\n" +
          'name = "rust_workspace_pkg_b_fixture"\n' +
          'version = "0.9.0"\n',
      );

      yield* logTest.consecutive(log.all, [
        {
          msg: "bumping rust_workspace_dep_fixture with minor",
          level: "info",
        },
        {
          msg: "bumping rust_workspace_pkg_b_fixture with minor",
          level: "info",
        },
      ]);
    });

    it("bumps multi with workspace root dependency requirements", function* () {
      const log = yield* logTest.useCapturedLogger();
      const rustFolder = f.copy("pkg.rust-workspace-root-deps");

      const commands = [
        {
          dependencies: [
            "rust_root_pkg_b_fixture",
            "rust_root_pkg_c_fixture",
            "rust_root_pkg_d_fixture",
          ],
          manager: "rust",
          path: "./pkg-a/",
          pkg: "rust_root_pkg_a_fixture",
          type: "minor",
          parents: {},
        },
        {
          dependencies: undefined,
          manager: "rust",
          path: "./pkg-b/",
          pkg: "rust_root_pkg_b_fixture",
          type: "minor",
          parents: {},
        },
        {
          dependencies: undefined,
          manager: "rust",
          path: "./pkg-c/",
          pkg: "rust_root_pkg_c_fixture",
          type: "minor",
          parents: {},
        },
        {
          dependencies: undefined,
          manager: "rust",
          path: "./pkg-d/",
          pkg: "rust_root_pkg_d_fixture",
          type: "minor",
          parents: {},
        },
        {
          dependencies: undefined,
          manager: "rust",
          path: "./pkg-e/",
          pkg: "rust_root_pkg_e_fixture",
          type: "minor",
          parents: {},
        },
        {
          dependencies: undefined,
          manager: "rust",
          path: "./pkg-f/",
          pkg: "rust_root_pkg_f_fixture",
          type: "minor",
          parents: {},
        },
        {
          dependencies: undefined,
          manager: "rust",
          path: "./pkg-g/",
          pkg: "rust_root_pkg_g_fixture",
          type: "minor",
          parents: {},
        },
      ];

      const config = {
        ...configDefaults,
        packages: {
          rust_root_pkg_a_fixture: {
            path: "./pkg-a/",
            manager: "rust",
          },
          rust_root_pkg_b_fixture: {
            path: "./pkg-b/",
            manager: "rust",
          },
          rust_root_pkg_c_fixture: {
            path: "./pkg-c/",
            manager: "rust",
          },
          rust_root_pkg_d_fixture: {
            path: "./pkg-d/",
            manager: "rust",
          },
          rust_root_pkg_e_fixture: {
            path: "./pkg-e/",
            manager: "rust",
          },
          rust_root_pkg_f_fixture: {
            path: "./pkg-f/",
            manager: "rust",
          },
          rust_root_pkg_g_fixture: {
            path: "./pkg-g/",
            manager: "rust",
          },
        },
      };

      const allPackages = yield* readAllPkgFiles({ config, cwd: rustFolder });

      yield* apply({
        logger: logger.operations,
        //@ts-expect-error
        commands,
        config,
        allPackages,
        cwd: rustFolder,
      });

      // requirements for member crates in the root [workspace.dependencies]
      // table track the bumped versions: partial pins stay partial, exact
      // pins and range prefixes are kept, and path-only, `*`,
      // comparator-range, or wildcard entries are left untouched
      const modifiedRootFile = yield* loadFile("Cargo.toml", rustFolder);
      expect(modifiedRootFile.content).toBe(
        "[workspace]\n" +
          'members = ["pkg-a", "pkg-b", "pkg-c", "pkg-d", "pkg-e", "pkg-f", "pkg-g"]\n' +
          "\n" +
          "[workspace.dependencies]\n" +
          'serde = "1.0"\n' +
          'rust_root_pkg_a_fixture = { version = "0.6", path = "pkg-a", default-features = false }\n' +
          'rust_root_pkg_b_fixture = "^0.9.0"\n' +
          'rust_root_pkg_c_fixture = { path = "pkg-c", version = "*" }\n' +
          'rust_root_pkg_d_fixture = { path = "pkg-d" }\n' +
          'rust_root_pkg_e_fixture = ">=0.2, <0.4"\n' +
          'rust_root_pkg_f_fixture = "0.*"\n' +
          'rust_root_pkg_g_fixture = "=0.6"\n',
      );

      const modifiedAPKGFile = yield* loadFile("pkg-a/Cargo.toml", rustFolder);
      expect(modifiedAPKGFile.content).toBe(
        "[package]\n" +
          'name = "rust_root_pkg_a_fixture"\n' +
          'version = "0.6.0"\n' +
          "\n" +
          "[dependencies]\n" +
          "serde = { workspace = true }\n" +
          "rust_root_pkg_b_fixture = { workspace = true }\n" +
          "rust_root_pkg_c_fixture = { workspace = true }\n" +
          "\n" +
          "[dev-dependencies]\n" +
          "rust_root_pkg_d_fixture = { workspace = true }\n",
      );

      yield* logTest.consecutive(log.all, [
        {
          msg: "bumping rust_root_pkg_a_fixture with minor",
          level: "info",
        },
        {
          msg: "bumping rust_root_pkg_b_fixture with minor",
          level: "info",
        },
        {
          msg: "bumping rust_root_pkg_c_fixture with minor",
          level: "info",
        },
        {
          msg: "bumping rust_root_pkg_d_fixture with minor",
          level: "info",
        },
        {
          msg: "bumping rust_root_pkg_e_fixture with minor",
          level: "info",
        },
        {
          msg: "bumping rust_root_pkg_f_fixture with minor",
          level: "info",
        },
        {
          msg: "bumping rust_root_pkg_g_fixture with minor",
          level: "info",
        },
        {
          msg: "bumping rust_root_pkg_a_fixture in Cargo.toml [workspace.dependencies] to 0.6",
          level: "info",
        },
        {
          msg: "bumping rust_root_pkg_b_fixture in Cargo.toml [workspace.dependencies] to ^0.9.0",
          level: "info",
        },
        {
          msg: "bumping rust_root_pkg_g_fixture in Cargo.toml [workspace.dependencies] to =0.6",
          level: "info",
        },
      ]);
    });

    it("bumps workspace root dependency requirements across multiple roots", function* () {
      const log = yield* logTest.useCapturedLogger();
      const rustFolder = f.copy("pkg.rust-workspace-root-deps-multi");

      const commands = [
        {
          dependencies: undefined,
          manager: "rust",
          path: "./core/pkg-a/",
          pkg: "rust_multi_root_pkg_a_fixture",
          type: "minor",
          parents: {},
        },
        {
          dependencies: undefined,
          manager: "rust",
          path: "./core/pkg-b/",
          pkg: "rust_multi_root_pkg_b_fixture",
          type: "minor",
          parents: {},
        },
        {
          dependencies: ["rust_multi_root_pkg_a_fixture"],
          manager: "rust",
          path: "./tools/pkg-c/",
          pkg: "rust_multi_root_pkg_c_fixture",
          type: "minor",
          parents: {},
        },
      ];

      const config = {
        ...configDefaults,
        packages: {
          rust_multi_root_pkg_a_fixture: {
            path: "./core/pkg-a/",
            manager: "rust",
          },
          rust_multi_root_pkg_b_fixture: {
            path: "./core/pkg-b/",
            manager: "rust",
          },
          rust_multi_root_pkg_c_fixture: {
            path: "./tools/pkg-c/",
            manager: "rust",
          },
        },
      };

      const allPackages = yield* readAllPkgFiles({ config, cwd: rustFolder });

      yield* apply({
        logger: logger.operations,
        //@ts-expect-error
        commands,
        config,
        allPackages,
        cwd: rustFolder,
      });

      // each workspace root in the repo is bumped, and a member that no root
      // declares (pkg-b) leaves every [workspace.dependencies] table alone
      const modifiedCoreRootFile = yield* loadFile(
        "core/Cargo.toml",
        rustFolder,
      );
      expect(modifiedCoreRootFile.content).toBe(
        "[workspace]\n" +
          'members = ["pkg-a", "pkg-b"]\n' +
          "\n" +
          "[workspace.dependencies]\n" +
          'serde = "1.0"\n' +
          'rust_multi_root_pkg_a_fixture = { version = "0.6", path = "pkg-a" }\n',
      );

      // a root can declare a crate from a sibling workspace by path, so the
      // requirement is bumped wherever it is declared
      const modifiedToolsRootFile = yield* loadFile(
        "tools/Cargo.toml",
        rustFolder,
      );
      expect(modifiedToolsRootFile.content).toBe(
        "[workspace]\n" +
          'members = ["pkg-c"]\n' +
          "\n" +
          "[workspace.dependencies]\n" +
          'rust_multi_root_pkg_a_fixture = { version = "^0.6", path = "../core/pkg-a" }\n' +
          'rust_multi_root_pkg_c_fixture = { version = "1.1", path = "pkg-c" }\n',
      );

      yield* logTest.consecutive(log.all, [
        {
          msg: "bumping rust_multi_root_pkg_a_fixture with minor",
          level: "info",
        },
        {
          msg: "bumping rust_multi_root_pkg_b_fixture with minor",
          level: "info",
        },
        {
          msg: "bumping rust_multi_root_pkg_c_fixture with minor",
          level: "info",
        },
        {
          msg: "bumping rust_multi_root_pkg_a_fixture in core/Cargo.toml [workspace.dependencies] to 0.6",
          level: "info",
        },
        {
          msg: "bumping rust_multi_root_pkg_a_fixture in tools/Cargo.toml [workspace.dependencies] to ^0.6",
          level: "info",
        },
        {
          msg: "bumping rust_multi_root_pkg_c_fixture in tools/Cargo.toml [workspace.dependencies] to 1.1",
          level: "info",
        },
      ]);
    });

    it("bumps workspace root dependency requirements with an inherited version", function* () {
      const log = yield* logTest.useCapturedLogger();
      const rustFolder = f.copy("pkg.rust-workspace-root-deps-inherited");

      const commands = [
        {
          dependencies: undefined,
          manager: "rust",
          path: "./",
          pkg: "rust_root_inherited_fixture",
          type: "minor",
          parents: {},
        },
      ];

      const config = {
        ...configDefaults,
        packages: {
          rust_root_inherited_fixture: {
            path: "./",
            manager: "rust",
          },
        },
      };

      // the member manifests inherit their version from the workspace root
      // (`version.workspace = true`) and are never rewritten, so they keep
      // their checked-out bytes; compare them against their original content
      const originalAPKGFile = yield* loadFile("pkg-a/Cargo.toml", rustFolder);
      const originalBPKGFile = yield* loadFile("pkg-b/Cargo.toml", rustFolder);

      const allPackages = yield* readAllPkgFiles({ config, cwd: rustFolder });

      yield* apply({
        logger: logger.operations,
        //@ts-expect-error
        commands,
        config,
        allPackages,
        cwd: rustFolder,
      });

      // the package's version lives at [workspace.package] in the root
      // manifest, so the root carries both the bumped version and the bumped
      // [workspace.dependencies] requirement, while the entry without a
      // version (path and features only) is left untouched
      const modifiedRootFile = yield* loadFile("Cargo.toml", rustFolder);
      expect(modifiedRootFile.content).toBe(
        "[workspace]\n" +
          'members = ["pkg-a", "pkg-b"]\n' +
          "\n" +
          "[workspace.package]\n" +
          'version = "1.3.0"\n' +
          "\n" +
          "[workspace.dependencies]\n" +
          'rust_root_inherited_fixture = { version = "1.3", path = "pkg-a" }\n' +
          'rust_root_inherited_helper_fixture = { path = "pkg-b", default-features = false }\n',
      );

      const modifiedAPKGFile = yield* loadFile("pkg-a/Cargo.toml", rustFolder);
      expect(modifiedAPKGFile.content).toBe(originalAPKGFile.content);
      const modifiedBPKGFile = yield* loadFile("pkg-b/Cargo.toml", rustFolder);
      expect(modifiedBPKGFile.content).toBe(originalBPKGFile.content);

      yield* logTest.consecutive(log.all, [
        {
          msg: "bumping rust_root_inherited_fixture with minor",
          level: "info",
        },
        {
          msg: "bumping rust_root_inherited_fixture in Cargo.toml [workspace.dependencies] to 1.3",
          level: "info",
        },
      ]);
    });

    it("bumps multi with object dep", function* () {
      const log = yield* logTest.useCapturedLogger();
        const rustFolder = f.copy("pkg.rust-multi-object-dep");

      const commands = [
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

      const allPackages = yield* readAllPkgFiles({ config, cwd: rustFolder });

      yield* apply({
        logger: logger.operations,
        //@ts-expect-error
        commands,
        config,
        allPackages,
        cwd: rustFolder,
      });

      const modifiedAPKGFile = yield* loadFile("pkg-a/Cargo.toml", rustFolder);
      expect(modifiedAPKGFile.content).toBe(
        "[package]\n" +
          'name = "rust_pkg_a_fixture"\n' +
          'version = "0.6.0"\n' +
          "\n" +
          "[dependencies]\n" +
          'rust_pkg_b_fixture = { version = "0.9.0", path = "../rust_pkg_b_fixture" }\n',
      );

      const modifiedBPKGFile = yield* loadFile("pkg-b/Cargo.toml", rustFolder);
      expect(modifiedBPKGFile.content).toBe(
        "[package]\n" + 'name = "rust_pkg_b_fixture"\n' + 'version = "0.9.0"\n',
      );

      yield* logTest.consecutive(log.all, [
          { msg: "bumping rust_pkg_a_fixture with minor", level: "info" },
          { msg: "bumping rust_pkg_b_fixture with minor", level: "info" },
        ]);
    });

    it("bumps multi with dep missing patch", function* () {
      const log = yield* logTest.useCapturedLogger();
        const rustFolder = f.copy("pkg.rust-multi-no-patch-dep");

      const commands = [
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

      const allPackages = yield* readAllPkgFiles({ config, cwd: rustFolder });

      yield* apply({
        logger: logger.operations,
        //@ts-expect-error
        commands,
        config,
        allPackages,
        cwd: rustFolder,
      });

      const modifiedAPKGFile = yield* loadFile("pkg-a/Cargo.toml", rustFolder);
      expect(modifiedAPKGFile.content).toBe(
        "[package]\n" +
          'name = "rust_pkg_a_fixture"\n' +
          'version = "0.6.0"\n' +
          "\n" +
          "[dependencies]\n" +
          'rust_pkg_b_fixture = "0.9"\n',
      );

      const modifiedBPKGFile = yield* loadFile("pkg-b/Cargo.toml", rustFolder);
      expect(modifiedBPKGFile.content).toBe(
        "[package]\n" + 'name = "rust_pkg_b_fixture"\n' + 'version = "0.9.0"\n',
      );

      yield* logTest.consecutive(log.all, [
          { msg: "bumping rust_pkg_a_fixture with minor", level: "info" },
          { msg: "bumping rust_pkg_b_fixture with minor", level: "info" },
        ]);
    });

    it("bump multi as patch with object dep missing patch", function* () {
      const log = yield* logTest.useCapturedLogger();
        const rustFolder = f.copy("pkg.rust-multi-object-no-patch-dep");

      const commands = [
        {
          dependencies: ["rust_pkg_b_fixture"],
          manager: "rust",
          path: "./pkg-a/",
          pkg: "rust_pkg_a_fixture",
          type: "patch",
          parents: {},
        },
        {
          dependencies: undefined,
          manager: "rust",
          path: "./pkg-b/",
          pkg: "rust_pkg_b_fixture",
          type: "patch",
          parents: {},
        },
      ];

      const config = {
        ...configDefaults,
        packages: {
          rust_pkg_a_fixture: {
            // version: 0.5.0 with 0.8 dep on pkg-b
            path: "./pkg-a/",
            manager: "rust",
          },
          rust_pkg_b_fixture: {
            // version: 0.8.8
            path: "./pkg-b/",
            manager: "rust",
          },
        },
      };

      const allPackages = yield* readAllPkgFiles({ config, cwd: rustFolder });

      yield* apply({
        logger: logger.operations,
        //@ts-expect-error
        commands,
        config,
        allPackages,
        cwd: rustFolder,
      });

      const modifiedAPKGFile = yield* loadFile("pkg-a/Cargo.toml", rustFolder);
      expect(modifiedAPKGFile.content).toBe(
        "[package]\n" +
          'name = "rust_pkg_a_fixture"\n' +
          'version = "0.5.1"\n' +
          "\n" +
          "[dependencies]\n" +
          'rust_pkg_b_fixture = { version = "0.8", path = "../rust_pkg_b_fixture" }\n',
      );

      const modifiedBPKGFile = yield* loadFile("pkg-b/Cargo.toml", rustFolder);
      expect(modifiedBPKGFile.content).toBe(
        "[package]\n" + 'name = "rust_pkg_b_fixture"\n' + 'version = "0.8.9"\n',
      );

      yield* logTest.consecutive(log.all, [
          { msg: "bumping rust_pkg_a_fixture with patch", level: "info" },
          { msg: "bumping rust_pkg_b_fixture with patch", level: "info" },
        ]);
    });

    it("bumps multi as minor with object dep missing patch", function* () {
      const log = yield* logTest.useCapturedLogger();
        const rustFolder = f.copy("pkg.rust-multi-object-no-patch-dep");

      const commands = [
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

      const allPackages = yield* readAllPkgFiles({ config, cwd: rustFolder });

      yield* apply({
        logger: logger.operations,
        //@ts-expect-error
        commands,
        config,
        allPackages,
        cwd: rustFolder,
      });

      const modifiedAPKGFile = yield* loadFile("pkg-a/Cargo.toml", rustFolder);
      expect(modifiedAPKGFile.content).toBe(
        "[package]\n" +
          'name = "rust_pkg_a_fixture"\n' +
          'version = "0.6.0"\n' +
          "\n" +
          "[dependencies]\n" +
          'rust_pkg_b_fixture = { version = "0.9", path = "../rust_pkg_b_fixture" }\n',
      );

      const modifiedBPKGFile = yield* loadFile("pkg-b/Cargo.toml", rustFolder);
      expect(modifiedBPKGFile.content).toBe(
        "[package]\n" + 'name = "rust_pkg_b_fixture"\n' + 'version = "0.9.0"\n',
      );

      yield* logTest.consecutive(log.all, [
          { msg: "bumping rust_pkg_a_fixture with minor", level: "info" },
          { msg: "bumping rust_pkg_b_fixture with minor", level: "info" },
        ]);
    });
  });

  describe("on yaml", () => {
    it("bumps single", function* () {
      const log = yield* logTest.useCapturedLogger();
        const flutterFolder = f.copy("pkg.dart-flutter-single");

      const commands = [
        {
          dependencies: undefined,
          manager: "flutter",
          path: "./",
          pkg: "test_app",
          type: "minor",
          parents: {},
        },
      ];

      const config = {
        ...configDefaults,
        packages: {
          test_app: {
            path: "./",
            manager: "flutter",
          },
        },
      };

      const allPackages = yield* readAllPkgFiles({
        config,
        cwd: flutterFolder,
      });

      yield* apply({
        logger: logger.operations,
        //@ts-expect-error
        commands,
        config,
        allPackages,
        cwd: flutterFolder,
      });
      const modifiedFile = yield* loadFile("pubspec.yaml", flutterFolder);
      expect(modifiedFile.content).toBe(
        "name: test_app\ndescription: a great one\nhomepage: https://github.com/\nversion: 0.4.0\n" +
          "environment:\n  sdk: \">=2.10.0 <3.0.0\"\n" +
          "dependencies:\n  flutter:\n    sdk: flutter\n  meta: any\n  provider: ^4.3.2\n  related_package:\n    git:\n      url: git@github.com:jbolda/covector.git\n      ref: main\n      path: __fixtures__/haha/\n" +
          "dev_dependencies:\n  flutter_test:\n    sdk: flutter\n  build_runner: any\n  json_serializable: any\n  mobx_codegen: any\n" +
          "flutter:\n  assets:\n    - assets/schema/\n    - assets/localization/\n",
      );

      yield* logTest.consecutive(log.all, [
          { msg: "bumping test_app with minor", level: "info" },
        ]);
    });
  });
});
