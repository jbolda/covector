import { template } from "../src/template.ts";
import { describe, it } from "@effectionx/vitest";
import { expect } from "vitest";

describe("template", () => {
  it("works with template syntax", function* () {
    const value = template("hello ${name}")({ name: "world" });

    expect(value).toBe("hello world");
  });
});
