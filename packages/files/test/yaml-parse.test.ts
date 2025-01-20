import { describe, it } from "../../../helpers/test-scope.ts";
import { expect } from "vitest";
import fixtures from "fixturez";

import { readPkgFile } from "../src";
const f = fixtures(__dirname);

describe("parses yaml", () => {
  const yamlFolder = f.copy("pkg.dart-flutter-single");

  it("with file specified", function* () {
    const yamlFile = yield* readPkgFile({
      file: "pubspec.yaml",
      cwd: yamlFolder,
      nickname: "test_app",
    });
    expect(yamlFile.name).toBe("test_app");
    expect(yamlFile?.pkg?.name).toBe("test_app");
    expect(yamlFile.version).toBe("0.3.1");
  });

  it("by deriving via dart", function* () {
    const yamlFile = yield* readPkgFile({
      cwd: yamlFolder,
      pkgConfig: { manager: "dart", path: "." },
      nickname: "test_app",
    });
    expect(yamlFile.name).toBe("test_app");
    expect(yamlFile?.pkg?.name).toBe("test_app");
    expect(yamlFile.version).toBe("0.3.1");
  });

  it("by deriving via flutter", function* () {
    const yamlFile = yield* readPkgFile({
      cwd: yamlFolder,
      pkgConfig: { manager: "flutter", path: "." },
      nickname: "test_app",
    });
    expect(yamlFile.name).toBe("test_app");
    expect(yamlFile?.pkg?.name).toBe("test_app");
    expect(yamlFile.version).toBe("0.3.1");
  });
});
