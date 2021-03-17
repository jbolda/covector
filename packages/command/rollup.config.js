import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import pkg from "./package.json";

export default {
  treeshake: true,
  perf: true,
  input: { index: "index.ts" },
  output: {
    dir: "dist",
    format: "cjs",
    entryFileNames: "[name].js",
    exports: "named",
  },
  plugins: [
    typescript({ module: "CommonJS", exclude: ["**.test.ts"] }),
    commonjs({ extensions: [".js"] }),
    resolve({
      // pass custom options to the resolve plugin
      customResolveOptions: {
        moduleDirectory: "node_modules",
      },
    }),
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
