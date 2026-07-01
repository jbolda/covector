import { defineConfig } from "tsdown";

export default defineConfig({
  format: "esm",
  sourcemap: false,
  clean: true,
  dts: true,
  unbundle: true,
  shims: true,
  deps: {
    skipNodeModulesBundle: true,
  },
});
