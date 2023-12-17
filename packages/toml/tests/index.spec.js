const { TomlDocument } = require("..");
const { readFileSync } = require("fs");
const { join } = require("path");

function assert(lh, rh) {
  if (lh != rh) {
    console.error(`Assertion failed: \`${lh}\` is not equal to \`${rh}\``);
    process.exit(1);
  }
}

const cargoToml = readFileSync(join(__dirname, "../Cargo.toml"), "utf8");
const toml = new TomlDocument(cargoToml);

assert(toml.package.name, "covector-toml");
assert(toml.package.edition, "2021");
assert(toml.lib["crate-type"], "cdylib");
assert(Array.isArray(toml.dependencies), false);
assert(Array.isArray(toml.dependencies.toml_edit.features), true);

toml.package.name = "newName";
assert(toml.package.name, "newName");
