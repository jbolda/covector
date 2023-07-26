import { z } from "zod";
import { statSync } from "fs";
import path from "path";

export const fileSchema = z.object({
  content: z.string(),
  path: z.string(),
  filename: z.string(),
  extname: z.string(),
});

const commandBaseSchema = z.object({
  runFromRoot: z.boolean().optional(),
  retries: z.number().array().optional(),
  dryRunCommand: z.union([z.boolean(), z.string()]).optional(),
  pipe: z.boolean().optional(),
});
const processCommandSchema = commandBaseSchema.extend({
  command: z.string(),
});
const useCommandSchema = commandBaseSchema.extend({
  use: z.enum(["fetch:check"]),
  options: z.object({ url: z.string().url() }),
});
const complexCommandSchema = z.union([processCommandSchema, useCommandSchema]);
const commandTypesSchema = z.union([z.string(), complexCommandSchema]);
const commandSchema = z.union([
  z.boolean(),
  commandTypesSchema,
  commandTypesSchema.array(),
]);

export const allCommandsSchema = z
  .object({
    version: commandSchema.optional(),
    prepublish: commandSchema.optional(),
    publish: commandSchema.optional(),
    postpublish: commandSchema.optional(),
    errorOnVersionRange: z.string().optional(),
    releaseTag: z.union([z.literal(false), z.string()]).optional(),
    assets: z
      .union([
        z
          .object({
            path: z.string(),
            name: z.string(),
          })
          .array(),
        z.literal(false),
      ])
      .optional(),
  })
  .passthrough();

export const pkgManagerSchema = allCommandsSchema.pick({
  version: true,
  prepublish: true,
  publish: true,
  postpublish: true,
  errorOnVersionRange: true,
  releaseTag: true,
  assets: true,
});

export const packageConfigSchema = (cwd: string = ".") =>
  allCommandsSchema
    .extend({
      manager: z.string().optional(),
      path: z.string().optional(),
      dependencies: z.string().array().optional(),
      packageFileName: z.string().optional(),
    })
    .transform((packageConfig) => {
      if (!packageConfig.path || !cwd) return packageConfig;

      const checkDir = statSync(path.join(cwd, packageConfig.path));
      if (checkDir.isFile()) {
        const dirName = path.dirname(packageConfig.path);
        const packageFileName = path.basename(packageConfig.path);

        return { ...packageConfig, path: dirName, packageFileName };
      } else {
        return packageConfig;
      }
    });

export const configFileSchema = (cwd: string = ".") =>
  z
    .object({
      changeFolder: z.string().optional(),
      gitSiteUrl: z.string().optional(),
      additionalBumpTypes: z.string().array().optional(),
      defaultChangeTag: z.string().optional(),
      pkgManagers: z.record(pkgManagerSchema).optional(),
      packages: z.record(packageConfigSchema(cwd)),
      changeTags: z.record(z.string()).optional(),
    })
    .strict();
