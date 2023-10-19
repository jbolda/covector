import type { Config, CovectorStatus, PackageFile } from "@covector/types";
import type { PullRequestPayload } from "./types";

export function formatComment({
  covectored,
  payload,
}: {
  covectored: CovectorStatus;
  payload: PullRequestPayload;
}) {
  if ("applied" in covectored) {
    let comment = `### Changes Through ${payload.pull_request.head.sha}\n`;
    let addChangeFileUrl = `${payload.pull_request.html_url}/../../new/${
      payload.pull_request.head.ref
    }${newChangeFile(
      payload.pull_request.number,
      payload.pull_request.title,
      covectored.config
    )}`;
    let defaultFooter =
      "\n<p align='right'><em>Read about <a href='../tree/HEAD/.changes'>change files</a><em> or the docs at <a href='https://github.com/jbolda/covector/tree/main/covector'>github.com/jbolda/covector</a><em></p>";

    return (
      `${comment}${covectored.response}\n\n` +
      markdownAccordion(
        "<i>Planned Package Versions</i>",
        `The following package release${"s"} are the planned based on the context of changes in this pull request.\n${objectAsMarkdownTable(
          covectored.applied,
          ["package", "current", "next"],
          ["name", "version", "pkg.version"]
        )}`
      ) +
      `[Add another change file through the GitHub UI by following this link.](${addChangeFileUrl})\n` +
      defaultFooter
    );
  } else if ("pkgReadyToPublish" in covectored) {
    return covectored.response;
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

function newChangeFile(prNumber: number, prTitle: string, config: Config) {
  const packageBumps = Object.keys(config.packages)
    .map((pkgName) => `"${pkgName}": patch`)
    .join("\n");
  const content = `---\n${packageBumps}\n---\n\n${prTitle}\n`;
  return `?filename=.changes/change-pr-${prNumber}.md&value=${encodeURI(
    content
  )}`;
}
