const { apply } = require("./index");
const toVFile = require("to-vfile");
const fixtures = require("fixturez");
const f = fixtures(__dirname);

describe("package file test", () => {
  it("parses json", async () => {
    const jsonFolder = f.copy("pkg.js-single-json");
    const originalVFile = await toVFile.read(
      jsonFolder + "/package.json",
      "utf-8"
    );
    await apply(jsonFolder + "/package.json");
    const modifiedVFile = await toVFile.read(
      jsonFolder + "/package.json",
      "utf-8"
    );
    console.log(originalVFile, modifiedVFile);
    expect(originalVFile).toStrictEqual(modifiedVFile);
  });
});
