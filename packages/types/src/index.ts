/* @covector/files */
export interface VFile {
  contents: string;
  path: string;
  extname: string;
  data: { filename: string };
}

// Pkg for toml has a `.packages` so we need to address this union
// or otherwise normalize it, and it will be an issue as
// we add other PackageFile types / sources
export interface Pkg {
  name: string;
  version: string;
  dependencies?: { [k: string]: string };
  devDependencies?: { [k: string]: string };
}

export interface PkgMinimum {
  version?: string;
  pkg?: Pkg;
  versionMajor?: number;
  versionMinor?: number;
  versionPatch?: number;
  versionPrerelease?: readonly string[] | (string | number)[] | null;
}

export interface PackageFile extends PkgMinimum {
  vfile?: VFile;
  name?: string;
}

export interface PreFile {
  vfile?: VFile;
  tag: string;
  changes: string[] | [];
}

export type ConfigFile = {
  vfile?: VFile;
  gitSiteUrl?: string;
  pkgManagers?: {
    [k: string]: {
      version?: string;
      publish?: string;
      errorOnVersionRange?: string;
    };
  };
  packages: {
    [k: string]: {
      manager?: string;
      path?: string;
      dependencies?: string[];
      packageFileName?: string;
      version?: string;
      publish?: string;
      errorOnVersionRange?: string;
    };
  };
  additionalBumpTypes?: string[];
};

export type ChangelogFile = {
  path: string;
  contents: string;
  extname: string;
  data: { filename: string };
};

/* @covector/command */
export type RunningCommand = {
  command?: string | Function;
  shouldRunCommand?: boolean;
  runFromRoot?: boolean;
};

export type NormalizedCommand = {
  command?: string;
  runFromRoot?: boolean;
  dryRunCommand?: boolean;
  pipe?: boolean;
};

/* @covector/changelog */
export type PkgCommandResponse = {
  precommand?: string | boolean;
  command: string | boolean;
  postcommand?: string | boolean;
  pkg?: Pkg;
};

export type Meta = {
  dependencies: { [k: string]: string }[];
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
      }[];
    };
  };
  summary: string;
  meta?: Meta;
};

/* @covector/assemble */
export type Changeset = {
  releases?: { [k: string]: CommonBumps } | {};
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

export type Change = {
  releases: { [k: string]: CommonBumps };
  meta?: { filename?: string };
};

export type Release = {
  type: CommonBumps;
  changes: Change[];
  parents?: string[];
};

export type PkgVersion = {
  pkg: string;
  path?: string;
  packageFileName?: string;
  type?: string;
  parents?: string[];
  precommand?: (string | any)[] | null;
  command?: (string | any)[] | null;
  postcommand?: (string | any)[] | null;
  manager?: string;
  dependencies?: string[];
  errorOnVersionRange?: string;
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
  precommand?: (string | any)[] | null;
  command?: (string | any)[] | null;
  postcommand?: (string | any)[] | null;
  manager: string;
  dependencies?: string[];
  getPublishedVersion?: string;
  assets?: { name: string; path: string }[];
  pkgFile?: PackageFile;
  errorOnVersionRange?: string;
  releaseTag?: string | false;
};

export type PipePublishTemplate = {
  pkg: PkgPublish;
  pkgFile?: PackageFile;
};

/* @covector/assemble */
export type ChangeParsed = {
  releases: { [k: string]: string };
  summary: string;
  meta: { dependencies: string };
};

export type Releases = {
  [k: string]: {
    parents: string[];
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
  parents: string[];
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

export interface CovectorStatus {
  response: string;
  pipeTemplate?: object;
  pkgReadyToPublish: PkgPublish[];
}

export interface CovectorVersion {
  commandsRan: CommandsRan;
  pipeTemplate: object;
}
export interface CovectorPublish {
  commandsRan: CommandsRan;
  pipeTemplate: object;
  response: string;
}

export type Covector =
  | CovectorStatus
  | CovectorVersion
  | CovectorPublish
  | { response: string };

export interface FunctionPipe extends PkgPublish {
  pkgCommandsRan: PkgCommandsRan;
}
