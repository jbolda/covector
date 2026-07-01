import { defineConfig } from "tsdown";
import { wasm } from "rolldown-plugin-wasm";

export default defineConfig({
  entry: ["index.ts"],
  format: "esm",
  sourcemap: false,
  dts: false,
  clean: true,
  shims: true,
  unbundle: false,
  deps: {
    alwaysBundle: (id) => {
      if (id.startsWith("node:")) return false;
      return true;
    },
  },
  plugins: [
    wasm({
      targetEnv: "node",
      maxFileSize: 0,
      fileName: "covector_toml_bg[extname]",
    }),
  ],
  copy: [
    { from: '../toml/dist/*.wasm', to: 'dist', flatten: true },
  ],
});
