import { nodeResolve } from "@rollup/plugin-node-resolve";
import esbuild from "rollup-plugin-esbuild";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { wasm } from "@rollup/plugin-wasm";
import MagicString from "magic-string";

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
    shimDepsPlugin({
      "toml/pkg/covector_toml.js": [
        {
          inject: `import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

__dirname = dirname(fileURLToPath(import.meta.url));`,
        },
      ],
    }),
    commonjs({
      extensions: [".js"],
      sourceMap: false,
      strictRequires: "auto",
    }),
    json(),
    wasm(),
  ],
  onwarn(warning, warn) {
    if (
      warning.message.includes("Circular dependency") ||
      warning.code === "THIS_IS_UNDEFINED"
    ) {
      return;
    }
    warn(warning);
  },
};

export default config;

function shimDepsPlugin(deps) {
  const transformed = {};

  return {
    name: "shim-deps",
    transform(code, id) {
      for (const file in deps) {
        if (id.replace(/\\/g, "/").endsWith(file)) {
          for (const { inject } of deps[file]) {
            const magicString = new MagicString(code);

            if (inject) {
              transformed[file] = true;
              magicString.prepend(inject);
            }

            code = magicString.toString();
          }

          console.log(`shimmed: ${file}`);

          return code;
        }
      }
    },
    buildEnd(err) {
      if (!err) {
        for (const file in deps) {
          if (!transformed[file]) {
            this.error(
              `Did not find "${file}" which is supposed to be shimmed, was the file renamed?`
            );
          }
        }
      }
    },
  };
}
