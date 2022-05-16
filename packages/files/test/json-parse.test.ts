import { describe, expect } from "vitest";
import { it } from "../../../suite";
import { readPkgFile } from "../src";
import fixtures from "fixturez";
const f = fixtures(__dirname);

describe("parses json", () => {
  const jsonFolder = f.copy("pkg.js-single-json");

  it("with file specified", function* () {
    const jsonFile = yield readPkgFile({
      file: "package.json",
      cwd: jsonFolder,
      nickname: "js-single-json-fixture",
    });
    expect(jsonFile.name).toBe("js-single-json-fixture");
    expect(jsonFile?.pkg?.name).toBe("js-single-json-fixture");
    expect(jsonFile.version).toBe("0.5.9");
  });

  it("by deriving", function* () {
    const jsonFile = yield readPkgFile({
      cwd: jsonFolder,
      pkgConfig: { manager: "javascript", path: "." },
      nickname: "js-single-json-fixture",
    });
    expect(jsonFile.name).toBe("js-single-json-fixture");
    expect(jsonFile?.pkg?.name).toBe("js-single-json-fixture");
    expect(jsonFile.version).toBe("0.5.9");
  });
});
