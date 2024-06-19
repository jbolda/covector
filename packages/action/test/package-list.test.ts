import { packageListToArray } from "../src/utils";
import { describe, it, expect, vi } from "vitest";

describe("packageListToArray", () => {
  it("returns empty array on empty string", () => {
    const list = "";
    const pkgArray = packageListToArray(list);
    expect(pkgArray.length).toBe(0);
  });

  it("splits on comma", () => {
    const list = "package1,package2,package3";
    const pkgArray = packageListToArray(list);
    expect(pkgArray[0]).toBe("package1");
    expect(pkgArray[1]).toBe("package2");
    expect(pkgArray[2]).toBe("package3");
  });

  it("considers a single package", () => {
    const list = "package17";
    const pkgArray = packageListToArray(list);
    expect(pkgArray[0]).toBe("package17");
    expect(pkgArray[1]).toBe(undefined);
  });
});
