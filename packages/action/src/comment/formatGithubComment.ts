import { CovectorStatus, PackageFile } from "@covector/types";

export function formatComment({ covectored }: { covectored: CovectorStatus }) {
  let comment = `## Changes Through [now]\n`;
  if ("applied" in covectored) {
    return (
      `${comment}${covectored.response}\n\n` +
      markdownAccordion(
        "Planned Package Versions",
        `The following package release${"s"} are the planned based on the context of changes in this pull request.\n${objectAsMarkdownTable(
          covectored.applied,
          ["package", "current", "next"],
          ["name", "version", "pkg.version"]
        )}`
      )
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
<summary>${summary}</summary>
${content}
</details>`;
}
