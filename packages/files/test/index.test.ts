import { beforeEach, describe, it } from "../../../helpers/test-scope.ts";
import { expect } from "vitest";
import pino from "pino";
import * as pinoTest from "pino-test";
import fixtures from "fixturez";

import {
  readPkgFile,
  readAllPkgFiles,
  readPreFile,
  configFile,
  changeFiles,
  loadChangeFiles,
  changeFilesRemove,
} from "../src";
import { createContext } from "effection";

const f = fixtures(__dirname);

describe("general file test final final v2", () => {
  const generalFolder = createContext<string>("generalFolder");

  beforeEach(function* () {
    yield* generalFolder.set(f.copy("pkg.general-file"));
  });

  it("parses general file", function* () {
    const generalFile = yield* readPkgFile({
      file: "VERSION",
      cwd: yield* generalFolder.expect(),
      nickname: "general-package",
    });
    expect(generalFile.name).toBe("general-package");
    expect(generalFile.version).toBe("6.1.0");
  });

  describe("parses pre", () => {
    beforeEach(function* () {
      // yield* generalFolder.set((f.copy("pkg.general-file")));
      console.log("hellop");
    });

    it("parses pre without changes", function* () {
      expect(yield* generalFolder.expect()).toBe("thing");
      const preFolder = f.copy("pre.with-changes");
      const preFile = yield* readPreFile({ cwd: preFolder });
      expect(preFile?.tag).toBe("beta");
      expect(preFile?.changes.length).toBe(0);
    });

    it("parses pre with changes", function* () {
      const preFolder = f.copy("pre.with-changes");
      const preFile = yield* readPreFile({ cwd: preFolder });
      expect(preFile?.tag).toBe("beta");
      expect(preFile?.changes.length).toBe(3);
      expect(preFile?.changes[1]).toBe("chocolate-pudding.md");
    });

    it("returns cleanly without pre", function* () {
      const preFolder = f.copy("pkg.js-basic");
      const preFile = yield* readPreFile({ cwd: preFolder });
      expect(preFile).toBe(null);
    });
  });
});

describe.skip("general file test", () => {
  it("parses general file", function* () {
    const generalFolder = f.copy("pkg.general-file");
    const generalFile = yield* readPkgFile({
      file: "VERSION",
      cwd: generalFolder,
      nickname: "general-package",
    });
    expect(generalFile.name).toBe("general-package");
    expect(generalFile.version).toBe("6.1.0");
  });

  it("parses config", function* () {
    const configFolder = f.copy("config.simple");
    const configArray = yield* configFile({ cwd: configFolder });
    expect((configArray as any).gitSiteUrl).toBe(
      "https://github.com/jbolda/covector"
    );
  });

  it("reads all package files in config", function* () {
    const configFolder = f.copy("integration.js-with-subcommands");
    const config = yield* configFile({ cwd: configFolder });
    const allPackages = yield* readAllPkgFiles({ config, cwd: configFolder });
    expect(allPackages["package-one"].name).toBe("package-one");
    expect(allPackages["package-one"].version).toBe("2.3.1");

    expect(allPackages["package-two"].name).toBe("package-two");
    expect(allPackages["package-two"].version).toBe("1.9.0");
  });

  describe("parses pre", () => {
    it("parses pre without changes", function* () {
      const preFolder = f.copy("pre.without-changes");
      const preFile = yield* readPreFile({ cwd: preFolder });
      expect(preFile?.tag).toBe("beta");
      expect(preFile?.changes.length).toBe(0);
    });

    it("parses pre with changes", function* () {
      const preFolder = f.copy("pre.with-changes");
      const preFile = yield* readPreFile({ cwd: preFolder });
      expect(preFile?.tag).toBe("beta");
      expect(preFile?.changes.length).toBe(3);
      expect(preFile?.changes[1]).toBe("chocolate-pudding.md");
    });

    it("returns cleanly without pre", function* () {
      const preFolder = f.copy("pkg.js-basic");
      const preFile = yield* readPreFile({ cwd: preFolder });
      expect(preFile).toBe(null);
    });
  });

  it("globs changes", function* () {
    const changesFolder = f.copy("changes.multiple-changes");
    const changesPaths = yield* changeFiles({ cwd: changesFolder });
    const changesFiles = yield* loadChangeFiles({
      cwd: changesFolder,
      paths: changesPaths,
    });
    expect(changesFiles).toMatchSnapshot();
  });

  it("ignores readme", function* () {
    const changesFolder = f.copy("changes.no-changes-with-readme");
    const changesArray = yield* changeFiles({ cwd: changesFolder });
    expect(changesArray).toMatchSnapshot();
  });

  it("deletes files", function* () {
    const stream = pinoTest.sink();
    const logger = pino(stream);
    const changesFolder = f.copy("integration.general-file");
    const changeFilesToDelete = [
      "./.changes/first-change.md",
      "./.changes/second-change.md",
    ];

    const filesRemoved = yield* changeFilesRemove({
      logger,
      cwd: changesFolder,
      paths: changeFilesToDelete,
    });

    expect(filesRemoved).toEqual(changeFilesToDelete);
  });
});
