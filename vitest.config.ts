/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  // resolve: {
  //   conditions: ["development"],
  // },
  test: {
    environment: "node",
    mockReset: true,
  },
  plugins: [wasm()],
});
