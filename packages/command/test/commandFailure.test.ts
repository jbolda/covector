import { it, captureError } from "@effection/jest";
import { attemptCommands } from "../src";
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

describe("attemptCommand fails", () => {
  let restoreConsole: RestoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir", "error", "warn"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  it("fails a function", function* () {
    yield captureError(
      attemptCommands({
        cwd: ".",
        command: "publish",
        commands: [
          {
            pkg: "pkg-nickname",
            manager: "none",
            command: ["boop"],
          },
        ],
        dryRun: false,
      })
    );

    //@ts-expect-error
    expect(console.error.mock.calls[0][0].message).toBe("spawn boop ENOENT");
  });

  it("retries a failed function", function* () {
    yield captureError(
      attemptCommands({
        cwd: ".",
        command: "",
        commands: [
          {
            pkg: "pkg-nickname",
            manager: "none",
            command: [{ command: "boop", retries: [500, 500] }],
          },
        ],
        dryRun: false,
      })
    );

    //@ts-expect-error
    expect(console.error.mock.calls[0][0].message).toBe("spawn boop ENOENT");
    //@ts-expect-error
    expect(console.error.mock.calls[1][0].message).toBe("spawn boop ENOENT");
    //@ts-expect-error
    expect(console.error.mock.calls[2][0].message).toBe("spawn boop ENOENT");
    //@ts-expect-error
    expect(console.error.mock.calls?.[3]?.[0]?.message).toBeUndefined();
  });
});
