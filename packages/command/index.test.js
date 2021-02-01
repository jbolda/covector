const { attemptCommands, runCommand } = require("./index");
const toVFile = require("to-vfile");
const mockConsole = require("jest-mock-console");
const fixtures = require("fixturez");
const f = fixtures(__dirname);

describe("command", () => {
  let restoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole(["log", "dir"]);
  });
  afterEach(() => {
    restoreConsole();
  });

  describe("attemptCommand", () => {
    it("invokes a function", function* () {
      yield attemptCommands({
        commands: [
          {
            name: "pkg-nickname",
            version: "0.5.6",
            command: async () => console.log("boop"),
          },
        ],
      });

      expect(console.log.mock.calls).toEqual([["boop"]]);
    });

    it("invokes an array of functions", function* () {
      yield attemptCommands({
        commands: [
          {
            name: "pkg-nickname",
            version: "0.5.6",
            command: [
              async () => console.log("boop"),
              async () => console.log("booop"),
              async () => console.log("boooop"),
              async () => console.log("booooop"),
            ],
          },
        ],
      });

      expect(console.log.mock.calls).toEqual([
        ["boop"],
        ["booop"],
        ["boooop"],
        ["booooop"],
      ]);
    });
  });
});
