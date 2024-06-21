import fs from "node:fs";
import path from "node:path";
import { assert } from "vitest";

export const loadContent = (cwd: string, pathToContent: string) => {
  return fs.readFileSync(path.join(cwd, pathToContent), { encoding: "utf8" });
};

export const checksWithObject =
  (keys = ["command"]) =>
  (received, expected) => {
    if (received.msg !== expected.msg || received.level !== expected.level) {
      assert.deepEqual(received, expected);
    }
    for (let key of keys) {
      if (expected?.[key]) assert.deepEqual(received?.[key], expected?.[key]);
    }
  };

export const checksChunksInMsg =
  (keys = ["command"]) =>
  (received, expected) => {
    if (received.level !== expected.level) {
      assert.deepEqual(received, expected);
    }
    if (expected.err) {
      assert.include(received.msg, expected.err);
    } else if (received.msg !== expected.msg) {
      if (Array.isArray(expected.msg)) {
        for (let chunk of expected.msg) {
          assert.include(
            received.msg,
            chunk,
            `\nexpected:\n${JSON.stringify(expected, null, 2)}\n\nreceived:\n${JSON.stringify(received, null, 2)}\n`
          );
        }
      } else {
        assert.deepEqual(received, expected);
      }
    }
    for (let key of keys) {
      if (expected?.[key]) assert.deepEqual(received?.[key], expected?.[key]);
    }
  };
