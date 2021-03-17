import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import pkg from "./package.json";

export default {
  treeshake: true,
  perf: true,
  input: {
    index: "src/index.ts",
    cli: "src/cli.ts",
    run: "src/run.ts",
    init: "src/init.ts",
  },
  output: {
    dir: "dist",
    format: "cjs",
    entryFileNames: "[name].js",
    exports: "named",
  },
  plugins: [
    typescript({ module: "CommonJS", exclude: ["**.test.ts"] }),
    commonjs({ extensions: [".js"] }),
    nodeResolve(),
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],
  watch: {
    chokidar: true,
    include: "src/**",
    exclude: "node_modules/**",
  },
};
