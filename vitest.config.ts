/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  // resolve: {
  //   conditions: ["development"],
  // },
  test: {
    environment: "node",
    mockReset: true,
  },
});
