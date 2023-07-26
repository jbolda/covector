import { it, captureError } from "@effection/jest";
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

describe("attemptCommand fails", () => {
  let restoreConsole: RestoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir", "error", "warn"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  it("fails a function", function* () {
    const errored = yield captureError(
      attemptCommands({
        cwd: ".",
        command: "publish",
        commands: [
          {
            ...base,
            pkg: "pkg-nickname",
            manager: "none",
            command: ["boop"],
          },
        ],
        dryRun: false,
      })
    );

    expect(errored.message).toBe("spawn boop ENOENT");
  });

  it("retries a failed function", function* () {
    const errored = yield captureError(
      attemptCommands({
        cwd: ".",
        command: "",
        commands: [
          {
            ...base,
            pkg: "pkg-nickname",
            manager: "none",
            command: [{ command: "boop", retries: [500, 500] }],
          },
        ],
        dryRun: false,
      })
    );

    const errorMessage = "spawn boop ENOENT";
    if (process.platform === "win32") {
      const errorLog =
        "'boop' is not recognized as an internal or external command,\r\n" +
        "operable program or batch file.";
      expect((console.error as any).mock.calls[0][0]).toBe(errorLog);
      expect((console.error as any).mock.calls[2][0]).toBe(errorLog);
      expect((console.error as any).mock.calls[4][0]).toBe(errorLog);
      expect((console.error as any).mock.calls[6]).toBeUndefined();
      expect(errored.message).toBe(errorMessage);
    } else {
      expect((console.error as any).mock.calls[0][0].message).toBe(
        errorMessage
      );
      expect((console.error as any).mock.calls[1][0].message).toBe(
        errorMessage
      );
      expect(
        (console.error as any).mock.calls?.[2]?.[0]?.message
      ).toBeUndefined();
      expect(errored.message).toBe(errorMessage);
    }
  });
});
