import { defineConfig } from "tsdown";
import { wasm } from "rolldown-plugin-wasm";

export default defineConfig({
  format: "esm",
  sourcemap: false,
  clean: true,
  dts: true,
  unbundle: false,
  plugins: [
    wasm({
      targetEnv: "node",
      maxFileSize: 0,
      fileName: "covector_toml_bg[extname]",
    }),
  ],
});
