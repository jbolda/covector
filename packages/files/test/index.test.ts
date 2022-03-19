import {
  readPkgFile,
  readPreFile,
  configFile,
  changeFiles,
  changeFilesToVfile,
} from "../src";
import { it } from "@effection/jest";
import mockConsole from "jest-mock-console";
import fixtures from "fixturez";
const f = fixtures(__dirname);

describe("file test", () => {
  describe("parses json", () => {
    const jsonFolder = f.copy("pkg.js-single-json");

    it("with file specified", function* () {
      const jsonVfile = yield readPkgFile({
        file: jsonFolder + "/package.json",
        nickname: "js-single-json-fixture",
      });
      expect(jsonVfile.name).toBe("js-single-json-fixture");
      expect(jsonVfile?.pkg?.name).toBe("js-single-json-fixture");
      expect(jsonVfile.version).toBe("0.5.9");
    });

    it("by deriving", function* () {
      const jsonVfile = yield readPkgFile({
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

    it("with file specified", function* () {
      const cargoVfile = yield readPkgFile({
        file: cargoFolder + "/Cargo.toml",
        nickname: "rust-single-fixture",
      });
      expect(cargoVfile.name).toBe("rust-single-fixture");
      //@ts-ignore
      expect(cargoVfile?.pkg?.package?.name).toBe("rust-single-fixture");
      expect(cargoVfile.version).toBe("0.5.0");
    });

    it("by deriving", function* () {
      const cargoVfile = yield readPkgFile({
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

    it("with file specified", function* () {
      const yamlVfile = yield readPkgFile({
        file: yamlFolder + "/pubspec.yaml",
        nickname: "test_app",
      });
      expect(yamlVfile.name).toBe("test_app");
      expect(yamlVfile?.pkg?.name).toBe("test_app");
      expect(yamlVfile.version).toBe("0.3.1");
    });

    it("by deriving via dart", function* () {
      const yamlVfile = yield readPkgFile({
        cwd: yamlFolder,
        pkgConfig: { manager: "dart", path: "." },
        nickname: "test_app",
      });
      expect(yamlVfile.name).toBe("test_app");
      expect(yamlVfile?.pkg?.name).toBe("test_app");
      expect(yamlVfile.version).toBe("0.3.1");
    });

    it("by deriving via flutter", function* () {
      const yamlVfile = yield readPkgFile({
        cwd: yamlFolder,
        pkgConfig: { manager: "flutter", path: "." },
        nickname: "test_app",
      });
      expect(yamlVfile.name).toBe("test_app");
      expect(yamlVfile?.pkg?.name).toBe("test_app");
      expect(yamlVfile.version).toBe("0.3.1");
    });
  });

  it("parses general file", function* () {
    const generalFolder = f.copy("pkg.general-file");
    const generalVfile = yield readPkgFile({
      file: generalFolder + "/VERSION",
      nickname: "general-package",
    });
    expect(generalVfile.name).toBe("general-package");
    expect(generalVfile.version).toBe("6.1.0");
  });

  it("parses config", function* () {
    const configFolder = f.copy("config.simple");
    const configArray = yield configFile({ cwd: configFolder });
    expect((configArray as any).stuff).toBe("here");
  });

  describe("parses pre", () => {
    it("parses pre without changes", function* () {
      const preFolder = f.copy("pre.without-changes");
      const preFile = yield readPreFile({ cwd: preFolder });
      expect(preFile?.tag).toBe("beta");
      expect(preFile?.changes.length).toBe(0);
    });

    it("parses pre with changes", function* () {
      const preFolder = f.copy("pre.with-changes");
      const preFile = yield readPreFile({ cwd: preFolder });
      expect(preFile?.tag).toBe("beta");
      expect(preFile?.changes.length).toBe(3);
      expect(preFile?.changes[1]).toBe("chocolate-pudding.md");
    });

    it("returns cleanly without pre", function* () {
      const preFolder = f.copy("pkg.js-basic");
      const preFile = yield readPreFile({ cwd: preFolder });
      expect(preFile).toBe(null);
    });
  });

  it("globs changes", function* () {
    const restoreConsole = mockConsole(["info"]);
    const changesFolder = f.copy("changes.multiple-changes");
    const changesPaths = yield changeFiles({ cwd: changesFolder });
    const changesVfiles = changeFilesToVfile({
      cwd: changesFolder,
      paths: changesPaths,
    });
    expect(changesVfiles).toMatchSnapshot();
    restoreConsole();
  });

  it("ignores readme", function* () {
    const restoreConsole = mockConsole(["info"]);
    const changesFolder = f.copy("changes.no-changes-with-readme");
    const changesArray = yield changeFiles({ cwd: changesFolder });
    expect(changesArray).toMatchSnapshot();
    restoreConsole();
  });
});
