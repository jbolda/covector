const { TomlDocument } = require("../dist");

const INPUT_TOML = `[package]
name = "covector-toml"
version = "0.0.0"
edition = "2021"
publish = false

# comment to be perserved

[lib]
crate-type = ["cdylib"]

[dependencies]
toml_edit = { version = "0.21", features = [
  "serde",
  "alloc",
  "std",
] }
wasm-bindgen = "0.2"
js-sys = "0.3.66"
`;

describe("toml", () => {
  it("parses", function () {
    const toml = new TomlDocument(INPUT_TOML);
    expect(toml.package.name).toBe("covector-toml");
    expect(toml.package.edition).toBe("2021");
    expect(toml.lib["crate-type"][0]).toBe("cdylib");
    expect(Array.isArray(toml.dependencies)).toBe(false);
    expect(Array.isArray(toml.dependencies.toml_edit.features)).toBe(true);
    expect(toml.package.description).toBe(undefined);
  });

  it("sets and gets", function () {
    const toml = new TomlDocument(INPUT_TOML);
    toml.package.name = "newName";
    toml.set("package.version", "0.1.0");
    toml.dependencies["toml_edit"].version = "1.0.0";
    expect(toml.package.name).toBe("newName");
    expect(toml.get("package.version")).toBe("0.1.0");
    expect(toml.dependencies["toml_edit"].version).toBe("1.0.0");
  });

  it("perserves ordering and formatting", function () {
    const toml = new TomlDocument(INPUT_TOML);
    expect(toml.toString()).toBe(INPUT_TOML);
  });

  it("in operator works fine", function () {
    const toml = new TomlDocument(INPUT_TOML);
    expect("package" in toml).toBe(true);
    expect("package.name" in toml).toBe(true);
    expect("package.license" in toml).toBe(false);
    expect("dependencies" in toml).toBe(true);
    let dependencies = toml.dependencies;
    expect("toml_edit" in dependencies).toBe(true);
  });
});
