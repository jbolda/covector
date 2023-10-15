import { CovectorStatus } from "@covector/types";

export function formatComment({ covectored }: { covectored: CovectorStatus }) {
  if (covectored.pkgReadyToPublish.length > 0) {
    return JSON.stringify(covectored.pkgReadyToPublish);
  } else {
    return "There are no packages ready to publish.";
  }
}
