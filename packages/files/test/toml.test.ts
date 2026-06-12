import { describe, it } from "../../../helpers/test-scope.ts";
import { expect } from "vitest";
import path from "path";
import fixtures from "fixturez";
import {
  readPkgFile,
  setPackageFileVersion,
  getPackageFileVersion,
  writePkgFile,
} from "../src";

const f = fixtures(__dirname);

describe("toml", () => {
  describe("parses", () => {
    describe("single rust crate", () => {
      const cargoFolder = f.copy("pkg.rust-single");

      it("with file specified", function* () {
        const cargoFile = yield readPkgFile({
          file: "Cargo.toml",
          cwd: cargoFolder,
          nickname: "rust-single-fixture",
        });
        expect(cargoFile.name).toBe("rust-single-fixture");
        expect(cargoFile?.pkg?.package?.name).toBe("rust-single-fixture");
        expect(cargoFile.version).toBe("0.5.0");
      });

      it("by deriving", function* () {
        const cargoFile = yield readPkgFile({
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

        const cargoFilePkgA = yield readPkgFile({
          file: "Cargo.toml",
          cwd: path.join(cargoFolder, "pkg-a"),
          nickname: "rust_pkg_a_fixture",
        });
        expect(cargoFilePkgA.name).toBe("rust_pkg_a_fixture");
        expect(cargoFilePkgA?.pkg?.package?.name).toBe("rust_pkg_a_fixture");
        expect(cargoFilePkgA.version).toBe("0.5.0");

        const cargoFilePkgB = yield readPkgFile({
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

        const cargoFilePkgA = yield readPkgFile({
          file: "Cargo.toml",
          cwd: cargoFolder,
          nickname: "rust_pkg_a_fixture",
        });
        expect(cargoFilePkgA?.pkg?.workspace?.package?.version).toBe("1.2.3");
        expect(cargoFilePkgA.version).toBe("1.2.3");

        const cargoFilePkgB = yield readPkgFile({
          file: "Cargo.toml",
          cwd: path.join(cargoFolder, "pkg-b"),
          nickname: "rust_pkg_b_fixture",
        });
        expect(cargoFilePkgB.name).toBe("rust_pkg_b_fixture");
        expect(cargoFilePkgB?.pkg?.package?.name).toBe("rust_pkg_b_fixture");
        expect(cargoFilePkgB.version).toBe("0.8.8");
      });

      it("with workspace = true dependencies", function* () {
        // Cargo workspace dependencies can use { workspace = true } to inherit
        // version from the workspace root. This should not throw an error.
        const cargoFolder = f.copy("pkg.rust-workspace-deps");

        const cargoFilePkgA = yield readPkgFile({
          file: "Cargo.toml",
          cwd: path.join(cargoFolder, "pkg-a"),
          nickname: "rust_workspace_dep_fixture",
        });
        expect(cargoFilePkgA.name).toBe("rust_workspace_dep_fixture");
        expect(cargoFilePkgA.version).toBe("0.5.0");

        // getPackageFileVersion should return empty string for workspace deps
        // instead of throwing an error
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

        const cargoFilePkgA = yield readPkgFile({
          file: "pkg-a/Cargo.toml",
          cwd: cargoFolder,
          nickname: "rust_pkg_a_fixture",
        });
        const cargoFileMemoryPkgA = setPackageFileVersion({
          pkg: cargoFilePkgA,
          version: "4.5.6",
          property: "version",
        });
        yield writePkgFile({
          packageFile: cargoFileMemoryPkgA,
          cwd: cargoFolder,
        });

        const cargoFileModifiedPkgA = yield readPkgFile({
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

        const cargoFilePkgA = yield readPkgFile({
          file: "Cargo.toml",
          cwd: cargoFolder,
          nickname: "rust_pkg_a_fixture",
        });
        const cargoFileMemoryPkgA = setPackageFileVersion({
          pkg: cargoFilePkgA,
          version: "4.5.6",
          property: "version",
        });
        yield writePkgFile({
          packageFile: cargoFileMemoryPkgA,
          cwd: cargoFolder,
        });

        const cargoFileModifiedPkgA = yield readPkgFile({
          file: "Cargo.toml",
          cwd: cargoFolder,
          nickname: "rust_pkg_a_fixture",
        });
        expect(cargoFileModifiedPkgA.version).toBe("4.5.6");
      });
    });
  });
});
