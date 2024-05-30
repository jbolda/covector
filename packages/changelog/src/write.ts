import { all, Operation } from "effection";
import { writeChangelog } from "@covector/files";

import type { File } from "@covector/types";

export function* writeAllChangelogs({
  writtenChanges,
  cwd,
}: {
  writtenChanges: {
    pkg: string;
    change: {
      changes: {
        name: string;
        version: string;
      };
      changelog?: File;
    };
    addition: string;
  }[];
  cwd: string;
}): Operation<any> {
  return yield all(
    writtenChanges.map((changes) => {
      const { changelog } = changes.change;
      if (changelog) {
        return writeChangelog({ changelog, cwd });
      } else {
        throw new Error(`Changelog not properly created: ${changes}`);
      }
    })
  );
}
