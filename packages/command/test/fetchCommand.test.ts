import { captureError, it } from "@effection/jest";
import { attemptCommands } from "../src";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);

const base = {
  errorOnVersionRange: null,
  precommand: null,
  command: null,
  postcommand: null,
};

const fillWithDefaults = ({ version }: { version: string }) => {
  const [versionMajor, versionMinor, versionPatch] = version
    .split(".")
    .map((v) => parseInt(v));
  return {
    version,
    currentVersion: version,
    versionMajor,
    versionMinor,
    versionPatch,
    pkg: { name: "none" },
    deps: {},
  };
};

describe("fetchCommand", () => {
  let restoreConsole: RestoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "error"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  describe("fetch npm registry", () => {
    it("success", function* () {
      yield attemptCommands({
        commands: [
          {
            ...base,
            pkg: "effection",
            pkgFile: fillWithDefaults({ version: "0.5.0" }),
            command: [
              {
                use: "fetch:check",
                options: {
                  url: "https://registry.npmjs.com/${ pkg.pkg }/${ pkg.pkgFile.version }",
                },
              },
            ],
          },
        ],
        command: "publish",
        cwd: "",
        dryRun: false,
      });

      expect((console.log as any).mock.calls).toEqual([]);
    });

    it("failure throws", function* () {
      const errored = yield captureError(
        attemptCommands({
          commands: [
            {
              ...base,
              pkg: "effection",
              pkgFile: fillWithDefaults({ version: "0.5.32" }),
              command: [
                {
                  use: "fetch:check",
                  options: {
                    url: "https://registry.npmjs.com/${ pkg.pkg }/${ pkg.pkgFile.version }",
                  },
                },
              ],
            },
          ],
          command: "publish",
          cwd: "",
          dryRun: false,
        })
      );

      expect(errored.message).toEqual(
        "effection request to https://registry.npmjs.com/effection/0.5.32 returned code 404: Not Found"
      );
    });

    it("failure retries then throws", function* () {
      const errored = yield captureError(
        attemptCommands({
          commands: [
            {
              ...base,
              pkg: "effection",
              pkgFile: fillWithDefaults({ version: "0.5.32" }),
              command: [
                {
                  use: "fetch:check",
                  options: {
                    url: "https://registry.npmjs.com/${ pkg.pkg }/${ pkg.pkgFile.version }",
                  },
                  retries: [500, 500],
                },
              ],
            },
          ],
          command: "publish",
          cwd: "",
          dryRun: false,
        })
      );

      expect(console.error as any).toBeCalledTimes(2);
      expect(errored.message).toEqual(
        "effection request to https://registry.npmjs.com/effection/0.5.32 returned code 404: Not Found"
      );
    });
  });

  describe("fetch cargo registry", () => {
    it("success", function* () {
      yield attemptCommands({
        commands: [
          {
            ...base,
            pkg: "tauri",
            pkgFile: fillWithDefaults({ version: "0.11.0" }),
            command: [
              {
                use: "fetch:check",
                options: {
                  url: "https://crates.io/api/v1/crates/${ pkg.pkg }/${ pkg.pkgFile.version }",
                },
              },
            ],
          },
        ],
        command: "publish",
        cwd: "",
        dryRun: false,
      });

      expect((console.log as any).mock.calls).toEqual([]);
    });

    it("failure throws", function* () {
      const errored = yield captureError(
        attemptCommands({
          commands: [
            {
              ...base,
              pkg: "tauri",
              pkgFile: fillWithDefaults({ version: "0.12.0" }),
              command: [
                {
                  use: "fetch:check",
                  options: {
                    url: "https://crates.io/api/v1/crates/${ pkg.pkg }/${ pkg.pkgFile.version }",
                  },
                },
              ],
            },
          ],
          command: "publish",
          cwd: "",
          dryRun: false,
        })
      );

      expect(errored.message).toEqual(
        `tauri request to https://crates.io/api/v1/crates/tauri/0.12.0 returned errors: [
  {
    "detail": "crate \`tauri\` does not have a version \`0.12.0\`"
  }
]`
      );
    });

    it("failure retries then throws", function* () {
      const errored = yield captureError(
        attemptCommands({
          commands: [
            {
              ...base,
              pkg: "tauri",
              pkgFile: fillWithDefaults({ version: "0.12.0" }),
              command: [
                {
                  use: "fetch:check",
                  options: {
                    url: "https://crates.io/api/v1/crates/${ pkg.pkg }/${ pkg.pkgFile.version }",
                  },
                  retries: [500, 500],
                },
              ],
            },
          ],
          command: "publish",
          cwd: "",
          dryRun: false,
        })
      );

      expect(console.error as any).toBeCalledTimes(2);
      expect(errored.message).toEqual(
        `tauri request to https://crates.io/api/v1/crates/tauri/0.12.0 returned errors: [
  {
    "detail": "crate \`tauri\` does not have a version \`0.12.0\`"
  }
]`
      );
    });
  });
});
