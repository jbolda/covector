import type { Config, CovectorStatus, PackageFile } from "@covector/types";
import type { PullRequestEvent } from "@octokit/webhooks-definitions/schema";

export function formatComment({
  covectored,
  payload,
  projectReadmeExists = false,
  changeFolder,
}: {
  covectored: CovectorStatus;
  payload: PullRequestEvent;
  projectReadmeExists: boolean;
  changeFolder: string;
}) {
  let comment = `### Package Changes Through ${payload.pull_request.head.sha}\n`;
  let addChangeFileUrl = `${payload.pull_request.html_url}/../../new/${
    payload.pull_request.head.ref
  }${newChangeFile({
    prNumber: payload.pull_request.number,
    prTitle: payload.pull_request.title,
    changeFolder,
    config: covectored.config,
  })}`;
  let defaultFooter = `\n\n---\n<p align='right'><em>Read ${
    projectReadmeExists
      ? `about <a href='../tree/HEAD/${changeFolder}'>change files</a><em> or`
      : ""
  } the docs at <a href='https://github.com/jbolda/covector/tree/main/packages/covector'>github.com/jbolda/covector</a><em></p>`;

  if ("applied" in covectored) {
    return (
      `${comment}${covectored.response}\n\n` +
      markdownAccordion(
        "<i>Planned Package Versions</i>",
        `The following package release${"s"} are the planned based on the context of changes in this pull request.\n${objectAsMarkdownTable(
          covectored.applied,
          ["package", "current", "next"],
          ["name", "currentVersion", "version"]
        )}`
      ) +
      `[Add another change file through the GitHub UI by following this link.](${addChangeFileUrl})\n` +
      defaultFooter
    );
  } else if ("pkgReadyToPublish" in covectored) {
    return (
      `${comment}${covectored.response}\n\n` +
      `[Add a change file through the GitHub UI by following this link.](${addChangeFileUrl})\n` +
      defaultFooter
    );
  }
}

function objectAsMarkdownTable(
  data: PackageFile[],
  headings: string[],
  contentItems: string[]
) {
  return `|${headings.map((heading) => ` ${heading} `).join("|")}|
  |${headings.map(() => `----`).join("|")}|
|${data
    .map((item) =>
      contentItems
        .map((contentItem) => ` ${getItem(item, contentItem)} `)
        .join("|")
    )
    .join("|\n")}|
`;
}

function getItem(item: Record<string, any>, acc: string): any {
  const keys = acc.split(".");
  const nextKey = keys[0];
  if (keys.length > 1) {
    return getItem(item[nextKey], keys.slice(1).join("."));
  } else {
    return item[nextKey];
  }
}

function markdownAccordion(summary: string, content: string) {
  return `<details>
<summary>${summary}</summary>\n
${content}
</details>\n\n`;
}

function newChangeFile({
  prNumber,
  prTitle,
  changeFolder,
  config,
}: {
  prNumber: number;
  prTitle: string;
  changeFolder: string;
  config: Config;
}) {
  const packageBumps = Object.keys(config.packages)
    .map((pkgName) => `"${pkgName}": patch`)
    .join("\n");
  const content = `---\n${packageBumps}\n---\n\n${prTitle}\n`;
  return `?filename=${changeFolder}/change-pr-${prNumber}.md&value=${encodeURI(
    content
  )}`;
}
