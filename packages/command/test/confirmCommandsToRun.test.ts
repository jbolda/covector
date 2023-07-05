import { it } from "@effection/jest";
import { confirmCommandsToRun } from "../src";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);

const fillWithDefaults = ({ version }: { version: string }) => {
  const [versionMajor, versionMinor, versionPatch] = version
    .split(".")
    .map((v) => parseInt(v));
  return {
    version,
    versionMajor,
    versionMinor,
    versionPatch,
    pkg: { name: "none" },
    deps: {},
  };
};

describe("confirmCommandsToRun", () => {
  let restoreConsole: RestoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "error"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  describe("processExecute", () => {
    describe("npm view", () => {
      it("already published", function* () {
        const commandsToRun = yield confirmCommandsToRun({
          commands: [
            {
              pkg: "effection",
              manager: "npm",
              pkgFile: fillWithDefaults({ version: "0.5.0" }),
              getPublishedVersion: "npm view effection@0.5.0 version --silent",
            },
          ],
          cwd: "",
          command: "publish",
        });

        expect((console.log as any).mock.calls).toEqual([
          [
            "Checking if effection@0.5.0 is already published with: npm view effection@0.5.0 version --silent",
          ],
          ["0.5.0"],
          ["effection@0.5.0 is already published. Skipping."],
        ]);
        expect(commandsToRun).toEqual([]);
      });

      it("needs publish", function* () {
        const commandsToRun = yield confirmCommandsToRun({
          commands: [
            {
              pkg: "effection",
              manager: "npm",
              pkgFile: fillWithDefaults({ version: "0.5.99" }),
              getPublishedVersion: "npm view effection@0.5.0 version --silent",
            },
          ],
          cwd: "",
          command: "publish",
        });

        expect((console.log as any).mock.calls).toEqual([
          [
            "Checking if effection@0.5.99 is already published with: npm view effection@0.5.0 version --silent",
          ],
          ["0.5.0"],
        ]);
        expect(commandsToRun).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ pkg: "effection" }),
          ])
        );
      });
    });

    describe("cargo through curl", () => {
      it("already published", function* () {
        const commandsToRun = yield confirmCommandsToRun({
          commands: [
            {
              pkg: "tauri",
              manager: "cargo",
              pkgFile: fillWithDefaults({ version: "0.11.0" }),
              getPublishedVersion:
                "curl -s https://crates.io/api/v1/crates/tauri/0.11.0 | if grep -q errors; then echo not found; else echo 0.11.0; fi;",
            },
          ],
          cwd: "",
          command: "publish",
        });

        expect((console.log as any).mock.calls).toEqual([
          [
            "Checking if tauri@0.11.0 is already published with: curl -s https://crates.io/api/v1/crates/tauri/0.11.0 | if grep -q errors; then echo not found; else echo 0.11.0; fi;",
          ],
          ["0.11.0"],
          ["tauri@0.11.0 is already published. Skipping."],
        ]);
        expect(commandsToRun).toEqual([]);
      });

      it("needs publish", function* () {
        const commandsToRun = yield confirmCommandsToRun({
          commands: [
            {
              pkg: "tauri",
              manager: "cargo",
              pkgFile: fillWithDefaults({ version: "0.12.0" }),
              getPublishedVersion:
                "curl -s https://crates.io/api/v1/crates/tauri/0.12.0 | if grep -q errors; then echo not found; else echo 0.12.0; fi;",
            },
          ],
          cwd: "",
          command: "publish",
        });

        expect((console.log as any).mock.calls).toEqual([
          [
            "Checking if tauri@0.12.0 is already published with: curl -s https://crates.io/api/v1/crates/tauri/0.12.0 | if grep -q errors; then echo not found; else echo 0.12.0; fi;",
          ],
          ["not found"],
        ]);

        expect(commandsToRun).toEqual(
          expect.arrayContaining([expect.objectContaining({ pkg: "tauri" })])
        );
      });
    });
  });

  describe("fetchCommand", () => {
    describe("fetch npm registry", () => {
      it("already published", function* () {
        const commandsToRun = yield confirmCommandsToRun({
          commands: [
            {
              pkg: "effection",
              manager: "npm",
              pkgFile: fillWithDefaults({ version: "0.5.0" }),
              getPublishedVersion: {
                use: "fetch:check",
                options: {
                  url: "https://registry.npmjs.com/${ pkg.pkg }/${ pkg.pkgFile.version }",
                },
              },
            },
          ],
          cwd: "",
          command: "publish",
        });

        expect((console.log as any).mock.calls).toEqual([
          [
            "Checking if effection@0.5.0 is already published with built-in fetch:check",
          ],
          ["effection@0.5.0 is already published. Skipping."],
        ]);
        expect(commandsToRun).toEqual([]);
      });

      it("needs publish", function* () {
        const commandsToRun = yield confirmCommandsToRun({
          commands: [
            {
              pkg: "effection",
              manager: "npm",
              pkgFile: fillWithDefaults({ version: "0.5.99" }),
              getPublishedVersion: {
                use: "fetch:check",
                options: {
                  url: "https://registry.npmjs.com/${ pkg.pkg }/${ pkg.pkgFile.version }",
                },
              },
            },
          ],
          cwd: "",
          command: "publish",
        });

        expect((console.log as any).mock.calls).toEqual([
          [
            "Checking if effection@0.5.99 is already published with built-in fetch:check",
          ],
        ]);
        expect(commandsToRun).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ pkg: "effection" }),
          ])
        );
      });
    });

    describe("fetch cargo registry", () => {
      it("already published", function* () {
        const commandsToRun = yield confirmCommandsToRun({
          commands: [
            {
              pkg: "tauri",
              manager: "cargo",
              pkgFile: fillWithDefaults({ version: "0.11.0" }),
              getPublishedVersion: {
                use: "fetch:check",
                options: {
                  url: "https://crates.io/api/v1/crates/${ pkg.pkg }/${ pkg.pkgFile.version }",
                },
              },
            },
          ],
          cwd: "",
          command: "publish",
        });

        expect((console.log as any).mock.calls).toEqual([
          [
            "Checking if tauri@0.11.0 is already published with built-in fetch:check",
          ],
          ["tauri@0.11.0 is already published. Skipping."],
        ]);
        expect(commandsToRun).toEqual([]);
      });

      it("needs publish", function* () {
        const commandsToRun = yield confirmCommandsToRun({
          commands: [
            {
              pkg: "tauri",
              manager: "cargo",
              pkgFile: fillWithDefaults({ version: "0.12.0" }),
              getPublishedVersion: {
                use: "fetch:check",
                options: {
                  url: "https://crates.io/api/v1/crates/${ pkg.pkg }/${ pkg.pkgFile.version }",
                },
              },
            },
          ],
          cwd: "",
          command: "publish",
        });

        expect((console.log as any).mock.calls).toEqual([
          [
            "Checking if tauri@0.12.0 is already published with built-in fetch:check",
          ],
        ]);

        expect(commandsToRun).toEqual(
          expect.arrayContaining([expect.objectContaining({ pkg: "tauri" })])
        );
      });
    });
  });
});
