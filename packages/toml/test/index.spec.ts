const { TomlDocument } = require("..");

const INPUT_TOML = `[package]
name = "covector-toml"
version = "0.0.0"
edition = "2021"
publish = false

[lib]
crate-type = ["cdylib"]

[dependencies]
toml_edit = { version = "0.21", features = ["serde"] }
wasm-bindgen = "0.2"
js-sys = "0.3.66"`;

describe("toml", () => {
  it("parses", function () {
    const toml = new TomlDocument(INPUT_TOML);
    expect(toml.package.name).toBe("covector-toml");
    expect(toml.package.edition).toBe("2021");
    expect(toml.lib["crate-type"]).toStrictEqual(["cdylib"]);
    expect(Array.isArray(toml.dependencies)).toBe(false);
    expect(Array.isArray(toml.dependencies.toml_edit.features)).toBe(true);
  });

  it("sets", function () {
    const toml = new TomlDocument(INPUT_TOML);
    toml.package.name = "newName";
    expect(toml.package.name).toBe("newName");
  });
});
