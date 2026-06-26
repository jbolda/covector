import {
  cancel,
  intro,
  isCancel,
  multiselect,
  outro,
  select,
  text,
} from "@clack/prompts";
import type { Logger, Covector, ConfigFile } from "@covector/types";
import { writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { configFile } from "@covector/files";
import { exec } from "@effectionx/process";
import { until, type Operation } from "effection";

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
}): Operation<Covector["add"]> {
  const config: ConfigFile = yield* configFile({ cwd });
  let packageBumps: { [k: string]: { bump: string; changeTag?: string } } = {};

  intro(`What have we changed?`);

  const pkgList = Object.keys(config.packages);
  const packagesWithBump = yield* until(
    multiselect({
      message: "Select packages which need a version bump.",
      options: pkgList.map((pkg) => ({
        value: pkg,
        label: pkg,
      })),
    }),
  );

  if (isCancel(packagesWithBump)) {
    cancel(`Skipping creating change file.`);
    return { response: "skipped" };
  }

  for (let pkg of packagesWithBump) {
    const additionalBumpTypes = config.additionalBumpTypes
      ? config.additionalBumpTypes
      : [];
    const bump = yield* until(
      select({
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
      }),
    );

    if (isCancel(bump)) {
      cancel(`Skipping creating change file.`);
      return { response: "skipped" };
    }

    let changeTag = undefined;
    if (config?.changeTags) {
      const tags = Object.keys(config.changeTags);
      const addTag = yield* until(
        select({
          message: `tag ${pkg} ${bump} bump with?`,
          options: ["none"].concat(tags).map((t) => ({ value: t, label: t })),
        }),
      );
      if (addTag !== "none") changeTag = addTag;

      if (isCancel(changeTag)) {
        cancel(`Skipping creating change file.`);
        return { response: "skipped" };
      }
    }
    packageBumps[pkg] = { bump, changeTag };
  }

  const summary = yield* until(
    text({
      message: `Please summarize the changes that occurred.`,
      validate(value) {
        if (value.length === 0) return "You must enter a summary.";
      },
    }),
  );
  if (isCancel(summary)) {
    cancel(`Skipping creating change file.`);
    return { response: "skipped" };
  }

  let branchName = "change-file.md";
  try {
    const currentBranch = yield* exec("git branch --show-current", {
      cwd,
    }).join();
    branchName = `${currentBranch.stdout.trim() || branchName}.md`;
  } catch (error) {
    // ignore, filled for convenience
  }
  const filename = yield* until(
    text({
      message: `Please name the change file.`,
      initialValue: branchName,
      validate(answer) {
        if (answer.length === 0) return "You must enter a file name.";
        if (!answer.endsWith(".md"))
          return "File name must end with the .md file extension.";
        if (existsSync(join(cwd, changeFolder, `${answer}`)))
          return `Change file ${join(changeFolder, `${answer}`)} already exists. Use a different filename.`;
      },
    }),
  );
  if (isCancel(filename)) {
    cancel(`Skipping creating change file.`);
    return { response: "skipped" };
  }

  const frontmatter = `---
${packagesWithBump
  .map(
    (pkg: string) =>
      `"${pkg}": ${packageBumps[pkg].bump}${packageBumps[pkg].changeTag ? `:${packageBumps[pkg].changeTag}` : ``}`,
  )
  .join("\n")}
---\n\n`;

  const content = `${frontmatter}${summary}\n`;

  yield* until(writeFile(join(cwd, changeFolder, `${filename}`), content));

  outro(`Change file written to ${join(changeFolder, `${filename}`)}`);
  return { response: "complete" };
};
