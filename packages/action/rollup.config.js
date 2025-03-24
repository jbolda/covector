import { nodeResolve } from "@rollup/plugin-node-resolve";
import esbuild from "rollup-plugin-esbuild";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { wasm } from "@rollup/plugin-wasm";

const config = {
  input: "./index.ts",
  output: {
    exports: "named",
    dir: "dist",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    nodeResolve({ preferBuiltins: true }),
    esbuild({ tsconfig: "tsconfig.json", target: "esnext" }),
    commonjs({
      extensions: [".js"],
      sourceMap: false,
      strictRequires: "auto",
    }),
    json(),
    wasm(),
  ],
  onwarn(warning, warn) {
    if (warning.message.includes("Circular dependency")) {
      return;
    }
    warn(warning);
  },
};

export default config;
