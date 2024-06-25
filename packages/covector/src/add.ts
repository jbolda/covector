import { type Logger } from "@covector/types";
import inquirer from "inquirer";
import { default as fsDefault } from "fs";
// this is compatible with node@12+
const fs = fsDefault.promises;
import { join } from "path";
import { configFile } from "@covector/files";

import type { ConfigFile } from "@covector/types";

export const add = function* ({
  logger,
  cwd = process.cwd(),
  changeFolder = ".changes",
  yes,
}: {
  logger: Logger;
  cwd?: string;
  changeFolder?: string;
  yes: boolean;
}): Generator<any, string, any> {
  const config: ConfigFile = yield configFile({ cwd });
  let packageBumps: { [k: string]: { bump: string; changeTag?: string } } = {};

  const answers: { packages: string[] } = yield inquirer.prompt([
    {
      type: "checkbox",
      message: "Select packages which need a version bump.",
      name: "packages",
      choices: Object.keys(config.packages).map((pkg) => ({ name: pkg })),
      validate(answer) {
        if (answer.length < 1) {
          return "You must choose at least one package.";
        }
        return true;
      },
    },
  ]);

  for (let pkg of answers.packages) {
    const { bump } = yield inquirer.prompt({
      type: "list",
      message: `bump ${pkg} with?`,
      name: "bump",
      choices: ["patch", "minor", "major"].concat(
        config.additionalBumpTypes ? config.additionalBumpTypes : []
      ),
    });
    let changeTag;
    if (config?.changeTags) {
      const tags = Object.keys(config.changeTags);
      const addTag = yield inquirer.prompt({
        type: "list",
        name: "changeTag",
        message: `bump ${pkg} with?`,
        choices: ["none"].concat(tags),
      });
      if (addTag.changeTag !== "none") changeTag = addTag.changeTag;
    }
    packageBumps[pkg] = { bump, changeTag };
  }

  const summary = yield inquirer.prompt({
    type: "input",
    name: "input",
    message: `Please summarize the changes that occurred.`,
    validate(answer) {
      if (answer.length < 1) {
        return "You must enter a summary.";
      }
      return true;
    },
  });

  const file = yield inquirer.prompt({
    type: "input",
    name: "name",
    message: `Please name the change file.`,
    validate(answer) {
      if (answer.length < 1) {
        return "You must enter a file name.";
      }
      return true;
    },
    filter: (input) => {
      if (input.endsWith(".md")) {
        return input;
      } else {
        return `${input}.md`;
      }
    },
  });

  const frontmatter = `---
${answers.packages
  .map(
    (pkg) =>
      `"${pkg}": ${packageBumps[pkg].bump}${packageBumps[pkg].changeTag ? `:${packageBumps[pkg].changeTag}` : ``}`
  )
  .join("\n")}
---\n\n`;

  const content = `${frontmatter}${summary.input}\n`;

  yield fs.writeFile(join(cwd, changeFolder, `${file.name}`), content);

  return "complete";
};
