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
    // from workspace @covector/toml
    { from: "../toml/dist/*.wasm", to: "dist", flatten: true },
    // from ctrlc-windows which comes in as a dep from @effectionx/process
    {
      from: "../../node_modules/ctrlc-windows/dist/arm64/*.{node,exe}",
      to: "dist/arm64",
    },
    {
      from: "../../node_modules/ctrlc-windows/dist/x64/*.{node,exe}",
      to: "dist/x64",
    },
  ],
});
