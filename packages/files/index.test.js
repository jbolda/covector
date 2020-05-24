const { pkgFile, configFile, changeFiles } = require("./index");
const fixtures = require("fixturez");
const f = fixtures(__dirname);

describe("file test", () => {
  it("parses toml", async () => {
    const cargoFolder = f.copy("pkg.rust-single");
    const cargoVfile = await pkgFile(cargoFolder + "/Cargo.toml");
    expect(cargoVfile.name).toBe("rust-single-fixture");
    expect(cargoVfile.version).toBe("0.5.0");
  });

  it("parses json", async () => {
    const jsonFolder = f.copy("pkg.root-only");
    const jsonVfile = await pkgFile(jsonFolder + "/package.json");
    expect(jsonVfile.name).toBe("root-only");
    expect(jsonVfile.version).toBe("1.0.0");
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
});
