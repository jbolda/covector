import {
  readPkgFile,
  configFile,
  changeFiles,
  changeFilesToVfile,
} from "./index";
import mockConsole from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);

describe("file test", () => {
  describe("parses json", () => {
    const jsonFolder = f.copy("pkg.js-single-json");

    it("with file specified", async () => {
      const jsonVfile = await readPkgFile({
        file: jsonFolder + "/package.json",
        nickname: "js-single-json-fixture",
      });
      expect(jsonVfile.name).toBe("js-single-json-fixture");
      expect(jsonVfile?.pkg?.name).toBe("js-single-json-fixture");
      expect(jsonVfile.version).toBe("0.5.9");
    });

    it("by deriving", async () => {
      const jsonVfile = await readPkgFile({
        cwd: jsonFolder,
        pkgConfig: { manager: "javascript", path: "." },
        nickname: "js-single-json-fixture",
      });
      expect(jsonVfile.name).toBe("js-single-json-fixture");
      expect(jsonVfile?.pkg?.name).toBe("js-single-json-fixture");
      expect(jsonVfile.version).toBe("0.5.9");
    });
  });

  describe("parses toml", () => {
    const cargoFolder = f.copy("pkg.rust-single");

    it("with file specified", async () => {
      const cargoVfile = await readPkgFile({
        file: cargoFolder + "/Cargo.toml",
        nickname: "rust-single-fixture",
      });
      expect(cargoVfile.name).toBe("rust-single-fixture");
      //@ts-ignore
      expect(cargoVfile?.pkg?.package?.name).toBe("rust-single-fixture");
      expect(cargoVfile.version).toBe("0.5.0");
    });

    it("by deriving", async () => {
      const cargoVfile = await readPkgFile({
        cwd: cargoFolder,
        pkgConfig: { manager: "rust", path: "." },
        nickname: "rust-single-fixture",
      });
      expect(cargoVfile.name).toBe("rust-single-fixture");
      //@ts-ignore
      expect(cargoVfile?.pkg?.package?.name).toBe("rust-single-fixture");
      expect(cargoVfile.version).toBe("0.5.0");
    });
  });

  describe("parses yaml", () => {
    const yamlFolder = f.copy("pkg.dart-flutter-single");

    it("with file specified", async () => {
      const yamlVfile = await readPkgFile({
        file: yamlFolder + "/pubspec.yaml",
        nickname: "test_app",
      });
      expect(yamlVfile.name).toBe("test_app");
      expect(yamlVfile?.pkg?.name).toBe("test_app");
      expect(yamlVfile.version).toBe("0.3.1");
    });

    it("by deriving via dart", async () => {
      const yamlVfile = await readPkgFile({
        cwd: yamlFolder,
        pkgConfig: { manager: "dart", path: "." },
        nickname: "test_app",
      });
      expect(yamlVfile.name).toBe("test_app");
      expect(yamlVfile?.pkg?.name).toBe("test_app");
      expect(yamlVfile.version).toBe("0.3.1");
    });

    it("by deriving via flutter", async () => {
      const yamlVfile = await readPkgFile({
        cwd: yamlFolder,
        pkgConfig: { manager: "flutter", path: "." },
        nickname: "test_app",
      });
      expect(yamlVfile.name).toBe("test_app");
      expect(yamlVfile?.pkg?.name).toBe("test_app");
      expect(yamlVfile.version).toBe("0.3.1");
    });
  });

  it("parses general file", async () => {
    const generalFolder = f.copy("pkg.general-file");
    const generalVfile = await readPkgFile({
      file: generalFolder + "/VERSION",
      nickname: "general-package",
    });
    expect(generalVfile.name).toBe("general-package");
    expect(generalVfile.version).toBe("6.1.0");
  });

  it("parses config", async () => {
    const configFolder = f.copy("config.simple");
    const configArray = await configFile({ cwd: configFolder });
    expect((configArray as any).stuff).toBe("here");
  });

  it("globs changes", async () => {
    const restoreConsole = mockConsole(["info"]);
    const changesFolder = f.copy("changes.multiple-changes");
    const changesPaths = await changeFiles({ cwd: changesFolder });
    const changesVfiles = changeFilesToVfile({
      cwd: changesFolder,
      paths: changesPaths,
    });
    expect(changesVfiles).toMatchSnapshot();
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
