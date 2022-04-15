import { readPkgFile } from "../src";
import { it } from "@effection/jest";
import fixtures from "fixturez";
const f = fixtures(__dirname);

describe("parses toml", () => {
  const cargoFolder = f.copy("pkg.rust-single");

  it("with file specified", function* () {
    const cargoFile = yield readPkgFile({
      file: "Cargo.toml",
      cwd: cargoFolder,
      nickname: "rust-single-fixture",
    });
    expect(cargoFile.name).toBe("rust-single-fixture");
    //@ts-ignore
    expect(cargoFile?.pkg?.package?.name).toBe("rust-single-fixture");
    expect(cargoFile.version).toBe("0.5.0");
  });

  it("by deriving", function* () {
    const cargoFile = yield readPkgFile({
      cwd: cargoFolder,
      pkgConfig: { manager: "rust", path: "." },
      nickname: "rust-single-fixture",
    });
    expect(cargoFile.name).toBe("rust-single-fixture");
    //@ts-ignore
    expect(cargoFile?.pkg?.package?.name).toBe("rust-single-fixture");
    expect(cargoFile.version).toBe("0.5.0");
  });
});
