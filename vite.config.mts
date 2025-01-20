/// <reference types="vitest" />

import { defineConfig } from "vite";

export default defineConfig({
  // resolve: {
  //   conditions: ["development"],
  // },
  test: {
    environment: "node",
  },
});
