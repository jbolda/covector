const unified = require("unified");
const parse = require("remark-parse");
const stringify = require("remark-stringify");
const frontmatter = require("remark-frontmatter");
const parseFrontmatter = require("remark-parse-yaml");

const processor = unified().use(parse).use(frontmatter).use(parseFrontmatter);

const parseChange = (testText) => {
  const parsed = processor.parse(testText);
  const processed = processor.runSync(parsed);
  let changeset = {};
  changeset.releases = processed.children[0].data.parsedValue;
  changeset.summary = processed.children.reduce((summary, element) => {
    if (element.type === "paragraph") {
      return `${element.children.reduce(
        (text, item) => `${text}${item.value}`,
        ""
      )}`;
    } else {
      return summary;
    }
  }, "");
  return changeset;
};

const compareBumps = (bumpOne, bumpTwo) => {
  // major, premajor, minor, preminor, patch, prepatch, or prerelease
  // enum and use Int to compare
  let bumps = new Map([
    ["major", 1],
    ["premajor", 2],
    ["minor", 3],
    ["preminor", 4],
    ["patch", 5],
    ["prepatch", 6],
    ["prerelease", 7],
  ]);
  return bumps.get(bumpOne) < bumps.get(bumpTwo) ? bumpOne : bumpTwo;
};

const mergeReleases = (changes) => {
  return changes.reduce((release, change) => {
    Object.keys(change.releases).forEach((pkg) => {
      if (!release[pkg]) {
        release[pkg] = {
          type: change.releases[pkg],
          changes: [change],
        };
      } else {
        release[pkg] = {
          type: compareBumps(release[pkg].type, change.releases[pkg]),
          changes: [...release[pkg].changes, change],
        };
      }
    });
    return release;
  }, {});
};

module.exports.assemble = (texts) => {
  let plan = {};
  plan.changes = texts.map((text) => parseChange(text));
  plan.releases = mergeReleases(plan.changes);
  return plan;
};
