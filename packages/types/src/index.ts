import { z } from "zod";
import {
  fileSchema,
  packageConfigSchema,
  allCommandsSchema,
  pkgManagerSchema,
  configFileSchema,
} from "@covector/files/src/schema";

export type File = z.infer<typeof fileSchema>;
export type PackageConfig = z.infer<ReturnType<typeof packageConfigSchema>>;
export type CommandConfig = z.infer<typeof allCommandsSchema>;
export type PkgManagerConfig = z.infer<typeof pkgManagerSchema>;
export type ConfigFile = z.infer<ReturnType<typeof configFileSchema>>;
export type Config = ConfigFile & { file?: File };

/* @covector/files */
interface NestedVersion {
  version?: string;
  [key: string]: any;
}
export type PkgFileVersion = string | NestedVersion;

// Pkg for toml has a `.packages` so we need to address this union
// or otherwise normalize it, and it will be an issue as
// we add other PackageFile types / sources
export interface Pkg {
  name: string;
  version?: string;
  package?: NestedVersion;
  dependencies?: Record<string, PkgFileVersion>;
  devDependencies?: Record<string, PkgFileVersion>;
  "dev-dependencies"?: Record<string, PkgFileVersion>;
  "build-dependencies"?: Record<string, PkgFileVersion>;
  target?: Record<string, PkgTarget>;
  [key: string]: any;
}

export interface PkgTarget {
  dependencies?: Record<string, PkgFileVersion>;
  "dev-dependencies"?: Record<string, PkgFileVersion>;
  "build-dependencies"?: Record<string, PkgFileVersion>;
}

export interface PkgMinimum {
  version: string;
  currentVersion: string;
  pkg: Pkg;
  versionMajor: number;
  versionMinor: number;
  versionPatch: number;
  deps: DepsKeyed;
  versionPrerelease?: readonly (string | number)[] | null;
}

export type DepTypes =
  | "dependencies"
  | "devDependencies"
  | "dev-dependencies"
  | "build-dependencies"
  | "target";
export type DepsKeyed = Record<
  string,
  {
    type: DepTypes;
    version: string;
  }[]
>;

export interface PackageFile extends PkgMinimum {
  file?: File;
  name?: string;
}

export interface PreFile {
  file?: File;
  tag: string;
  changes: string[] | [];
}

/* @covector/command */
export type BuiltInCommands = "fetch:check";
export type BuiltInCommandOptions = Record<string, any>;

export type RunningCommand = {
  command?: CommandTypes;
  use?: BuiltInCommands;
  options?: BuiltInCommandOptions;
  shouldRunCommand?: boolean;
  runFromRoot?: boolean;
  retries?: number[];
};

export type NormalizedCommand = {
  command?: string;
  use?: BuiltInCommands;
  options?: BuiltInCommandOptions;
  runFromRoot?: boolean;
  retries?: number[];
  dryRunCommand?: string | boolean;
  pipe?: boolean;
};

/* @covector/changelog */
export type Changelog = {
  changes: { name: string; version: string };
  changelog: File;
};

export type PkgCommandResponse = {
  precommand?: string | boolean;
  command: string | boolean;
  postcommand?: string | boolean;
  pkg?: Pkg;
};

export type Meta = {
  dependencies: string[];
  commits?: {
    filename: string;
    hashShort: string;
    hashLong: string;
    date: string;
    commitSubject: string;
  }[];
};

export type AssembledChanges = {
  releases: {
    [k: string]: {
      changes: {
        summary: string;
        meta?: Meta;
        tag?: string;
      }[];
    };
  };
  summary: string;
  meta?: Meta;
};

/* @covector/assemble */
export type Changeset = {
  releases?: { [k: string]: CommonBumps } | {};
  tag?: string;
  summary?: string;
  meta?: {
    filename: string;
    commits?: {
      hashShort: string;
      hashLong: string;
      date: string;
      commitSubject: string;
    }[];
  };
};

export type CommonBumps = "major" | "minor" | "patch" | "prerelease" | "noop";
export type CommonBumpsWithTag =
  | `${Exclude<CommonBumps, "noop">}:${string}`
  | "noop";

export type Change = {
  releases: { [k: string]: CommonBumps };
  tag?: string;
  meta: File;
};

export type Release = {
  type: CommonBumps;
  changes: Change[];
  parents?: Parents;
};

// where `true` effectively no-ops when running the command
export type CommandTypes = NormalizedCommand | string | Function | true;
export type Command = CommandTypes[] | CommandTypes | boolean;

export type PkgVersion = {
  pkg: string;
  path?: string;
  packageFileName?: string;
  type?: string;
  parents?: Parents;
  precommand: Command | null;
  command: Command | null;
  postcommand: Command | null;
  manager?: string;
  dependencies?: string[];
  errorOnVersionRange: string | null;
};

export type PipeVersionTemplate = {
  release: Release;
  pkg: PkgVersion;
};

export type PkgPublish = {
  pkg: string;
  path?: string;
  packageFileName?: string;
  changelog?: string;
  tag?: string;
  precommand: Command | null;
  command: Command | null;
  postcommand: Command | null;
  manager?: string;
  dependencies?: string[];
  getPublishedVersion?: CommandTypes;
  assets?: { name: string; path: string }[];
  pkgFile?: PackageFile;
  errorOnVersionRange: string | null;
  releaseTag?: string | false | null;
};

export type PipePublishTemplate = {
  pkg: PkgPublish;
  pkgFile?: PackageFile;
};

/* @covector/apply */
export type ChangeParsed = {
  releases: { [k: string]: string };
  tag?: string;
  summary: string;
  meta: { dependencies: string[] };
};

export type Changed = Record<
  string,
  {
    parents: Parents;
    type: CommonBumps;
    changes?: ChangeParsed[];
  }
>;

type Parents = Record<string, DepsKeyed>;

export type Releases = {
  [k: string]: {
    parents: Parents;
    type: CommonBumps;
    dependencies?: string[];
    changes?: ChangeParsed[];
    errorOnVersionRange?: string;
  };
};

export type PackageCommand = {
  pkg: string;
  dependencies?: string[];
  manager?: string;
  path: string;
  type: CommonBumps;
  parents: Parents;
};

/* covector */
export type PkgCommandsRan = {
  precommand: string | false;
  command: string | false;
  postcommand: string | false;
  applied: string | false;
  published?: boolean;
};

export type CommandsRan = {
  [k: string]: PkgCommandsRan;
};

export type CovectorStatus =
  | {
      response: string;
      pipeTemplate?: object;
      pkgReadyToPublish: PkgPublish[];
    }
  | {
      response: string;
      pipeTemplate?: object;
      config: Config;
      applied: PackageFile[];
      pkgVersion: PkgVersion[];
    };

export type CovectorVersion = {
  commandsRan: CommandsRan;
  pipeTemplate: object;
};
export type CovectorPublish = {
  commandsRan: CommandsRan;
  pipeTemplate: object;
  response: string;
};

export type Covector =
  | CovectorStatus
  | CovectorVersion
  | CovectorPublish
  | { response: string };

export interface FunctionPipe extends PkgPublish {
  pkgCommandsRan: PkgCommandsRan;
}
