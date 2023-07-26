import { it } from "@effection/jest";
import { parseChange } from "../src";

import type { File } from "@covector/files/src/schema";

describe("git parsing", () => {
  it("parses and returns multiple commits", function* () {
    // this was a file on a previous commit, we can use it
    //   to check the git command as that should still be in the history
    const file: File = {
      content: "---\nboop: patch\n---\n",
      // the `--` forces a path and won't throw an error on missing files
      path: `-- ./.changes/upgrade-to-effection-v2.md`,
      filename: "upgrade-to-effection-v2.md",
      extname: "md",
    };
    const parsed = yield parseChange({
      cwd: ".",
      file,
    });
    expect(parsed.meta.commits).toEqual([
      {
        commitSubject: "Effection v2 (#227)",
        date: "2022-03-19",
        hashLong: "a0acf81b2235ac142233d9c0e416d5e07af3cbb3",
        hashShort: "a0acf81",
      },
      {
        commitSubject: "bump effection to latest on v2 (#246)",
        date: "2022-10-26",
        hashLong: "a346221102075e647693851fd1019d66641f8014",
        hashShort: "a346221",
      },
      {
        commitSubject: "publish new versions (#231)",
        date: "2023-01-17",
        hashLong: "b5375deed67cb47f75e29b5628c5c15ff4b99b78",
        hashShort: "b5375de",
      },
    ]);
  });
});
