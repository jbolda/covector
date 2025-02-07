import {
  cancel,
  intro,
  isCancel,
  multiselect,
  outro,
  select,
  text,
} from "@clack/prompts";
import { type Logger } from "@covector/types";
import { writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { configFile } from "@covector/files";
import type { ConfigFile } from "@covector/types";
import { sh } from "@covector/command";

const exit = (value: any) => {
  if (isCancel(value)) {
    cancel(`Skipping creating change file.`);
    return true;
  }
  return false;
};

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
  const config: ConfigFile = yield* configFile({ cwd });
  let packageBumps: { [k: string]: { bump: string; changeTag?: string } } = {};

  intro(`What have we changed?`);

  const packagesWithBump: string[] = yield* multiselect({
    message: "Select packages which need a version bump.",
    options: Object.keys(config.packages).map((pkg) => ({
      value: pkg,
      label: pkg,
    })),
  });

  if (exit(packagesWithBump)) return "skipped";

  for (let pkg of packagesWithBump) {
    const additionalBumpTypes = config.additionalBumpTypes
      ? config.additionalBumpTypes
      : [];
    const bump = yield* select({
      message: `bump ${pkg} with?`,
      options: ["patch", "minor", "major"]
        .concat(additionalBumpTypes)
        .map((bumpKind) => ({
          value: bumpKind,
          label: bumpKind,
          hint: additionalBumpTypes.includes(bumpKind)
            ? "won't affect the version number"
            : undefined,
        })),
    });

    if (exit(bump)) return "skipped";

    let changeTag;
    if (config?.changeTags) {
      const tags = Object.keys(config.changeTags);
      const addTag = yield* select({
        message: `tag ${pkg} ${bump} bump with?`,
        options: ["none"].concat(tags).map((t) => ({ value: t, label: t })),
      });
      if (addTag !== "none") changeTag = addTag;

      if (exit(addTag)) return "skipped";
    }
    packageBumps[pkg] = { bump, changeTag };
  }

  const summary: string = yield* text({
    message: `Please summarize the changes that occurred.`,
    validate(value: string) {
      if (value.length === 0) return "You must enter a summary.";
    },
  });
  if (exit(summary)) return "skipped";

  let branchName = "change-file.md";
  try {
    const currentBranch = yield* sh(
      "git branch --show-current",
      {},
      false,
      logger
    );
    branchName = `${currentBranch?.out ?? branchName}.md`;
  } catch (error) {
    // ignore, filled for convenience
  }
  const filename: string = yield* text({
    message: `Please name the change file.`,
    initialValue: branchName,
    validate(answer) {
      if (answer.length === 0) return "You must enter a file name.";
      if (!answer.endsWith(".md"))
        return "File name must end with the .md file extension.";
      if (existsSync(join(cwd, changeFolder, `${answer}`)))
        return `Change file ${join(changeFolder, `${answer}`)} already exists. Use a different filename.`;
    },
  });
  if (exit(filename)) return "skipped";

  const frontmatter = `---
${packagesWithBump
  .map(
    (pkg: string) =>
      `"${pkg}": ${packageBumps[pkg].bump}${packageBumps[pkg].changeTag ? `:${packageBumps[pkg].changeTag}` : ``}`
  )
  .join("\n")}
---\n\n`;

  const content = `${frontmatter}${summary}\n`;

  yield* writeFile(join(cwd, changeFolder, `${filename}`), content);

  outro(`Change file written to ${join(changeFolder, `${filename}`)}`);
  return "complete";
};
