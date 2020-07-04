import { readPkgFile, configFile, changeFiles } from "./index"
import mockConsole from "jest-mock-console"
import fixtures from "fixturez"
const f = fixtures(__dirname);

describe("file test", () => {
  it("parses toml", async () => {
    const cargoFolder = f.copy("pkg.rust-single");
    const cargoVfile = await readPkgFile({
      file: cargoFolder + "/Cargo.toml",
      nickname: "rust-single-fixture",
    });
    expect(cargoVfile.name).toBe("rust-single-fixture");
    expect(cargoVfile.version).toBe("0.5.0");
  });

  it("parses json", async () => {
    const jsonFolder = f.copy("pkg.js-single-json");
    const jsonVfile = await readPkgFile({
      file: jsonFolder + "/package.json",
      nickname: "js-single-json-fixture",
    });
    expect(jsonVfile.name).toBe("js-single-json-fixture");
    expect(jsonVfile.version).toBe("0.5.9");
  });

  it("parses config", async () => {
    const configFolder = f.copy("config.simple");
    const configArray = await configFile({ cwd: configFolder });
    expect(configArray.stuff).toBe("here");
  });

  it("globs changes", async () => {
    const restoreConsole = mockConsole(["info"]);
    const changesFolder = f.copy("changes.multiple-changes");
    const changesArray = await changeFiles({ cwd: changesFolder });
    expect(changesArray).toMatchSnapshot();
    restoreConsole();
  });

  it("ignores readme", async () => {
    const restoreConsole = mockConsole(["info"]);
    const changesFolder = f.copy("changes.no-changes-with-readme");
    const changesArray = await changeFiles({ cwd: changesFolder });
    expect(changesArray).toMatchSnapshot();
    restoreConsole();
  });
});
