const { readPkgFile, configFile, changeFiles } = require("./index");
const fixtures = require("fixturez");
const f = fixtures(__dirname);

describe("file test", () => {
  it("parses toml", async () => {
    const cargoFolder = f.copy("pkg.rust-single");
    const cargoVfile = await readPkgFile(cargoFolder + "/Cargo.toml");
    expect(cargoVfile.name).toBe("rust-single-fixture");
    expect(cargoVfile.version).toBe("0.5.0");
  });

  it("parses json", async () => {
    const jsonFolder = f.copy("pkg.js-single-json");
    const jsonVfile = await readPkgFile(jsonFolder + "/package.json");
    expect(jsonVfile.name).toBe("js-single-json-fixture");
    expect(jsonVfile.version).toBe("0.5.9");
  });

  it("parses config", async () => {
    const configFolder = f.copy("config.simple");
    const configArray = await configFile({ cwd: configFolder });
    expect(configArray.stuff).toBe("here");
  });

  it("globs changes", async () => {
    const changesFolder = f.copy("changes.multiple-changes");
    const changesArray = await changeFiles({ cwd: changesFolder });
    expect(changesArray).toMatchSnapshot();
  });

  it("ignores readme", async () => {
    const changesFolder = f.copy("changes.no-changes-with-readme");
    const changesArray = await changeFiles({ cwd: changesFolder });
    expect(changesArray).toMatchSnapshot();
  });
});
