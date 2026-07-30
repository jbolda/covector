import { describe, it } from "@effectionx/vitest";
import { expect } from "vitest";
import path from "path";
// @ts-expect-error has no types
import fixtures from "fixturez";
import {
  readPkgFile,
  setPackageFileVersion,
  getPackageFileVersion,
  writePkgFile,
  readCargoWorkspaceRoots,
} from "../src";

const f = fixtures(__dirname);

describe("toml", () => {
  describe("parses", () => {
    describe("single rust crate", () => {
      const cargoFolder = f.copy("pkg.rust-single");

      it("with file specified", function* () {
        const cargoFile = yield* readPkgFile({
          file: "Cargo.toml",
          cwd: cargoFolder,
          nickname: "rust-single-fixture",
        });
        expect(cargoFile.name).toBe("rust-single-fixture");
        expect(cargoFile?.pkg?.package?.name).toBe("rust-single-fixture");
        expect(cargoFile.version).toBe("0.5.0");
      });

      it("by deriving", function* () {
        const cargoFile = yield* readPkgFile({
          cwd: cargoFolder,
          pkgConfig: { manager: "rust", path: "." },
          nickname: "rust-single-fixture",
        });
        expect(cargoFile.name).toBe("rust-single-fixture");
        expect(cargoFile?.pkg?.package?.name).toBe("rust-single-fixture");
        expect(cargoFile.version).toBe("0.5.0");
      });
    });

    describe("rust workspace", () => {
      it("without version inheritance", function* () {
        // `pkg.rust-multi` is a virtual workspace
        // https://doc.rust-lang.org/cargo/reference/workspaces.html#virtual-workspace
        const cargoFolder = f.copy("pkg.rust-multi");

        const cargoFilePkgA = yield* readPkgFile({
          file: "Cargo.toml",
          cwd: path.join(cargoFolder, "pkg-a"),
          nickname: "rust_pkg_a_fixture",
        });
        expect(cargoFilePkgA.name).toBe("rust_pkg_a_fixture");
        expect(cargoFilePkgA?.pkg?.package?.name).toBe("rust_pkg_a_fixture");
        expect(cargoFilePkgA.version).toBe("0.5.0");

        const cargoFilePkgB = yield* readPkgFile({
          file: "Cargo.toml",
          cwd: path.join(cargoFolder, "pkg-b"),
          nickname: "rust_pkg_b_fixture",
        });
        expect(cargoFilePkgB.name).toBe("rust_pkg_b_fixture");
        expect(cargoFilePkgB?.pkg?.package?.name).toBe("rust_pkg_b_fixture");
        expect(cargoFilePkgB.version).toBe("0.8.8");
      });

      it("with version inheritance", function* () {
        // `pkg.rust-multi` is a virtual workspace
        // https://doc.rust-lang.org/cargo/reference/workspaces.html#virtual-workspace
        const cargoFolder = f.copy("pkg.rust-multi-inheritance");

        const cargoFilePkgA = yield* readPkgFile({
          file: "Cargo.toml",
          cwd: cargoFolder,
          nickname: "rust_pkg_a_fixture",
        });
        expect(cargoFilePkgA?.pkg?.workspace?.package?.version).toBe("1.2.3");
        expect(cargoFilePkgA.version).toBe("1.2.3");

        const cargoFilePkgB = yield* readPkgFile({
          file: "Cargo.toml",
          cwd: path.join(cargoFolder, "pkg-b"),
          nickname: "rust_pkg_b_fixture",
        });
        expect(cargoFilePkgB.name).toBe("rust_pkg_b_fixture");
        expect(cargoFilePkgB?.pkg?.package?.name).toBe("rust_pkg_b_fixture");
        expect(cargoFilePkgB.version).toBe("0.8.8");
      });

      it("with workspace = true dependencies", function* () {
        const cargoFolder = f.copy("pkg.rust-workspace-deps");

        const cargoFilePkgA = yield* readPkgFile({
          file: "Cargo.toml",
          cwd: path.join(cargoFolder, "pkg-a"),
          nickname: "rust_workspace_dep_fixture",
        });
        expect(cargoFilePkgA.name).toBe("rust_workspace_dep_fixture");
        expect(cargoFilePkgA?.pkg?.package?.name).toBe(
          "rust_workspace_dep_fixture",
        );
        expect(cargoFilePkgA.version).toBe("0.5.0");

        // a `{ workspace = true }` dependency inherits its version from the
        // workspace root manifest, so there is no version to read here
        const depVersion = getPackageFileVersion({
          pkg: cargoFilePkgA,
          property: "dependencies",
          dep: "serde",
        });
        expect(depVersion).toBe("");
      });
    });
  });

  describe("writes", () => {
    describe("rust workspace", () => {
      it("without version inheritance", function* () {
        // `pkg.rust-multi` is a virtual workspace
        // https://doc.rust-lang.org/cargo/reference/workspaces.html#virtual-workspace
        const cargoFolder = f.copy("pkg.rust-multi");

        const cargoFilePkgA = yield* readPkgFile({
          file: "pkg-a/Cargo.toml",
          cwd: cargoFolder,
          nickname: "rust_pkg_a_fixture",
        });
        const cargoFileMemoryPkgA = setPackageFileVersion({
          pkg: cargoFilePkgA,
          version: "4.5.6",
          property: "version",
        });
        yield* writePkgFile({
          packageFile: cargoFileMemoryPkgA,
          cwd: cargoFolder,
        });

        const cargoFileModifiedPkgA = yield* readPkgFile({
          file: "pkg-a/Cargo.toml",
          cwd: cargoFolder,
          nickname: "rust_pkg_a_fixture",
        });
        expect(cargoFileModifiedPkgA.version).toBe("4.5.6");
      });

      it("with version inheritance", function* () {
        // `pkg.rust-multi` is a virtual workspace
        // https://doc.rust-lang.org/cargo/reference/workspaces.html#virtual-workspace
        const cargoFolder = f.copy("pkg.rust-multi-inheritance");

        const cargoFilePkgA = yield* readPkgFile({
          file: "Cargo.toml",
          cwd: cargoFolder,
          nickname: "rust_pkg_a_fixture",
        });
        const cargoFileMemoryPkgA = setPackageFileVersion({
          pkg: cargoFilePkgA,
          version: "4.5.6",
          property: "version",
        });
        yield* writePkgFile({
          packageFile: cargoFileMemoryPkgA,
          cwd: cargoFolder,
        });

        const cargoFileModifiedPkgA = yield* readPkgFile({
          file: "Cargo.toml",
          cwd: cargoFolder,
          nickname: "rust_pkg_a_fixture",
        });
        expect(cargoFileModifiedPkgA.version).toBe("4.5.6");
      });
    });
  });

  describe("cargo workspace roots", () => {
    it("finds no root for a standalone crate", function* () {
      const cargoFolder = f.copy("pkg.rust-single");

      const roots = yield* readCargoWorkspaceRoots({
        memberManifestPaths: ["Cargo.toml"],
        cwd: cargoFolder,
      });
      expect(roots).toEqual([]);
    });

    it("finds no root for a nested crate without a workspace above it", function* () {
      const cargoFolder = f.copy("pkg.rust-single-nested");

      const roots = yield* readCargoWorkspaceRoots({
        memberManifestPaths: ["crates/pkg-a/Cargo.toml"],
        cwd: cargoFolder,
      });
      expect(roots).toEqual([]);
    });

    it("finds a root per workspace when members span several", function* () {
      const cargoFolder = f.copy("pkg.rust-workspace-root-deps-multi");

      const roots = yield* readCargoWorkspaceRoots({
        memberManifestPaths: [
          "core/pkg-a/Cargo.toml",
          "core/pkg-b/Cargo.toml",
          "tools/pkg-c/Cargo.toml",
        ],
        cwd: cargoFolder,
      });
      expect(roots.map((root) => root.file.path)).toEqual([
        "core/Cargo.toml",
        "tools/Cargo.toml",
      ]);
    });

    it("finds a root manifest that is the member walked up from", function* () {
      const cargoFolder = f.copy("pkg.rust-workspace-root-deps-inherited");

      // covector bumps the root manifest itself when it holds the version
      // its members inherit at [workspace.package]
      const roots = yield* readCargoWorkspaceRoots({
        memberManifestPaths: ["Cargo.toml"],
        cwd: cargoFolder,
      });
      expect(roots.map((root) => root.file.path)).toEqual(["Cargo.toml"]);
    });

    it("terminates on an absolute manifest path", function* () {
      const cargoFolder = f.copy("pkg.rust-single");

      // manifest paths are cwd-relative everywhere covector produces them;
      // an absolute path is the worst case for the walk up the directory
      // tree, which must still stop at the top rather than loop forever
      const roots = yield* readCargoWorkspaceRoots({
        memberManifestPaths: ["/outside/the/tree/Cargo.toml"],
        cwd: cargoFolder,
      });
      expect(roots).toEqual([]);
    });
  });
});
