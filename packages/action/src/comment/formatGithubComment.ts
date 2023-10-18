import type { CovectorStatus, PackageFile } from "@covector/types";
import type { PullRequestPayload } from "./types";

export function formatComment({
  covectored,
  payload,
}: {
  covectored: CovectorStatus;
  payload: PullRequestPayload;
}) {
  let comment = `### Changes Through ${payload.pull_request.head.sha}\n`;
  let defaultFooter =
    "\n<p align='right'><em>Read about <a href='../tree/HEAD/.changes'>change files</a><em> or the docs at <a href='https://github.com/jbolda/covector/actions/tree/main/covector'>github.com/jbolda/covector</a><em></p>";

  if ("applied" in covectored) {
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
