/// <reference types="vitest" />
import { builtinModules } from "node:module";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

const external = [...builtinModules, ...builtinModules.map((m) => `node:${m}`)];

export default defineConfig({
  plugins: [wasm(), topLevelAwait()],
  build: {
    lib: {
      entry: resolve(__dirname, "index.ts"),
      fileName: "index",
      formats: ["es"],
    },
    sourcemap: true,
    rollupOptions: {
      external,
      output: {
        inlineDynamicImports: true,
      },
      preserveSymlinks: true,
    },
  },
  test: {},
});
