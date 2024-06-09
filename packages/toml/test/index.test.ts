import { describe, it } from "../../../helpers/test-scope.ts";
import { expect } from "vitest";
import { TomlDocument } from "../dist";

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
  it("parses", function* () {
    const toml = new TomlDocument(INPUT_TOML);
    expect(toml.package.name).to.deep.equal("covector-toml");
    expect(toml.package.edition).to.deep.equal("2021");
    expect(toml.lib["crate-type"][0]).to.deep.equal("cdylib");
    expect(Array.isArray(toml.dependencies)).to.deep.equal(false);
    expect(Array.isArray(toml.dependencies.toml_edit.features)).to.deep.equal(
      true
    );
    expect(toml.package.description).to.deep.equal(undefined);
  });

  it("sets and gets", function* () {
    const toml = new TomlDocument(INPUT_TOML);
    toml.package.name = "newName";
    toml.set("package.version", "0.1.0");
    toml.dependencies["toml_edit"].version = "1.0.0";
    expect(toml.package.name).to.deep.equal("newName");
    expect(toml.get("package.version")).to.deep.equal("0.1.0");
    expect(toml.dependencies["toml_edit"].version).to.deep.equal("1.0.0");
  });

  it("perserves ordering and formatting", function* () {
    const toml = new TomlDocument(INPUT_TOML);
    expect(toml.toString()).to.deep.equal(INPUT_TOML);
  });

  it("in operator works fine", function* () {
    const toml = new TomlDocument(INPUT_TOML);
    expect("package" in toml).to.deep.equal(true);
    expect("package.name" in toml).to.deep.equal(true);
    expect("package.license" in toml).to.deep.equal(false);
    expect("dependencies" in toml).to.deep.equal(true);
    let dependencies = toml.dependencies;
    expect("toml_edit" in dependencies).to.deep.equal(true);
  });
});
