import { it, captureError } from "@effection/jest";
import { attemptCommands } from "../src";
import mockConsole, { RestoreConsole } from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);

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

    if (process.platform === "win32") {
      const errorMessage =
        "'boop' is not recognized as an internal or external command,\r\n" +
        "operable program or batch file.";
      //@ts-expect-error
      expect(console.error.mock.calls[0][0]).toBe(errorMessage);
    } else {
      //@ts-expect-error
      expect(console.error.mock.calls[0][0].message).toBe("spawn boop ENOENT");
    }
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

    if (process.platform === "win32") {
      const errorMessage =
        "'boop' is not recognized as an internal or external command,\r\n" +
        "operable program or batch file.";
      //@ts-expect-error
      expect(console.error.mock.calls[0][0]).toBe(errorMessage);
      //@ts-expect-error
      expect(console.error.mock.calls[2][0]).toBe(errorMessage);
      //@ts-expect-error
      expect(console.error.mock.calls[4][0]).toBe(errorMessage);
      // ts-expect-error
      // expect(console.error.mock.calls[3]).toBeUndefined();
    } else {
      const errorMessage = "spawn boop ENOENT";
      //@ts-expect-error
      expect(console.error.mock.calls[0][0].message).toBe(errorMessage);
      //@ts-expect-error
      expect(console.error.mock.calls[1][0].message).toBe(errorMessage);
      //@ts-expect-error
      expect(console.error.mock.calls[2][0].message).toBe(errorMessage);
      //@ts-expect-error
      expect(console.error.mock.calls?.[3]?.[0]?.message).toBeUndefined();
    }
  });
});
