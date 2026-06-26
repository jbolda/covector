import type { Operation } from "effection";

export interface LoadedFile {
  content: string;
  path: string;
  filename: string;
  extname: string;
}

export type PkgFileVersion = string | { version?: string; [key: string]: any };

export interface PkgTarget {
  dependencies?: Record<string, PkgFileVersion>;
  "dev-dependencies"?: Record<string, PkgFileVersion>;
  "build-dependencies"?: Record<string, PkgFileVersion>;
}

export interface Pkg {
  name: string;
  version?: string;
  package?: { version?: string; [key: string]: any };
  dependencies?: Record<string, PkgFileVersion>;
  devDependencies?: Record<string, PkgFileVersion>;
  "dev-dependencies"?: Record<string, PkgFileVersion>;
  "build-dependencies"?: Record<string, PkgFileVersion>;
  target?: Record<string, PkgTarget>;
  [key: string]: any;
}

export interface PkgMinimum {
  version: string;
  currentVersion: string;
  pkg: Pkg | Record<string, any>;
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
  file?: LoadedFile;
  name: string;
}

export interface PreFile {
  file?: LoadedFile;
  tag: string;
  changes: string[] | [];
}

interface CommandBaseOptions {
  runFromRoot?: boolean;
  retries?: number[];
  dryRunCommand?: string | boolean;
  pipe?: boolean;
}

interface ProcessCommandOptions extends CommandBaseOptions {
  command: string;
}

interface UseCommandOptions extends CommandBaseOptions {
  use: "fetch:check";
  options: { url: string };
}

type CommandOption = ProcessCommandOptions | UseCommandOptions;
type RawCommand =
  | boolean
  | string
  | CommandOption
  | (string | CommandOption)[];

export type CommandConfig = {
  version?: RawCommand;
  prepublish?: RawCommand;
  publish?: RawCommand;
  postpublish?: RawCommand;
  errorOnVersionRange?: string;
  releaseTag?: string | false;
  assets?: { path: string; name: string }[] | false;
  [key: string]: any;
};

export type PkgManagerConfig = {
  version?: RawCommand;
  prepublish?: RawCommand;
  publish?: RawCommand;
  postpublish?: RawCommand;
  errorOnVersionRange?: string;
  releaseTag?: string | false;
  assets?: { path: string; name: string }[] | false;
};

export type PackageConfig = {
  manager?: string;
  path?: string;
  dependencies?: string[];
  packageFileName?: string;
  version?: RawCommand;
  prepublish?: RawCommand;
  publish?: RawCommand;
  postpublish?: RawCommand;
  errorOnVersionRange?: string;
  releaseTag?: string | false;
  assets?: { path: string; name: string }[] | false;
};

export type ConfigFile = {
  changeFolder?: string;
  gitSiteUrl?: string;
  timeout?: number;
  additionalBumpTypes?: string[];
  defaultChangeTag?: string;
  pkgManagers?: Record<string, PkgManagerConfig>;
  packages: Record<string, PackageConfig>;
  changeTags?: Record<string, string>;
};

export type Config = ConfigFile & { file?: File };

export type LoggerLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LoggerBucket = "default" | "stdout" | "stderr";

export interface LoggerAttribute {
  name: string;
  step?: string;
}

export interface LoggerBindings {
  msg?: string;
  renderAsYAML?: Record<string, any>;
  meta?: Record<string, unknown>;
}

export interface LoggerEntry extends LoggerBindings {
  command: string;
  step?: string;
  bucket: LoggerBucket;
  level: LoggerLevel;
  meta?: Record<string, unknown>;
}

export interface Logger {
  info(message: string | unknown | LoggerBindings): Operation<void>;
  error(message: string | unknown | LoggerBindings): Operation<void>;
  warn(message: string | unknown | LoggerBindings): Operation<void>;
  debug(message: string | unknown | LoggerBindings): Operation<void>;
  fatal(message: string | unknown | LoggerBindings): Operation<void>;
  stdout(message: string): Operation<void>;
  stderr(message: string): Operation<void>;
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
  changelog: LoadedFile;
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
  path: string;
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

export interface AssembledPlan {
  changes: Change[];
  releases: { [k: string]: Release };
}

export interface AssembledPlanParsed {
  changes: AssembledPlan["changes"];
  releases: { [k: string]: ReleaseParsed };
}

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
  summary?: string;
  meta: {
    file?: LoadedFile;
    dependencies?: string[];
    commits?: {
      hashShort: string;
      hashLong: string;
      date: string;
      commitSubject: string;
    }[];
    path: string;
  };
};

export type Release = {
  type: CommonBumps;
  changes: Change[];
  parents?: Parents;
};

// where `true` effectively no-ops when running the command
export type CommandTypes = NormalizedCommand | string | Function | true;
export type Command = CommandTypes[] | CommandTypes | boolean;

export interface PkgVersion {
  pkg: string;
  path?: string;
  dependencies?: string[];
  manager?: string;
  type: CommonBumps;
  parents: Parents;
  packageFileName?: string;
  precommand: Command | null;
  command: Command | null;
  postcommand: Command | null;
  errorOnVersionRange: string | null;
}

export type PipeVersionTemplate = {
  release: ReleaseParsed;
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
  meta: Meta;
};

export type ReleaseParsed = {
  type: CommonBumps;
  changes: ChangeParsed[];
  parents?: Parents;
};

export type ChangeContext<A> = (args: A) => Operation<
  () => Operation<{
    context: Record<string, Record<string, string>>;
    changeContext: Record<string, string>;
  }>
>;

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
  path?: string;
  dependencies?: string[];
  manager?: string;
  type: CommonBumps;
  parents: Parents;
};

/* covector */
export type PkgCommandsRan = {
  precommand: string | boolean;
  command: string | boolean;
  postcommand: string | boolean;
  applied?: PackageFile | false;
  published?: boolean;
  pkg?: PkgPublish;
};

export type CommandsRan = {
  [k: string]: PkgCommandsRan;
};

export type CovectorStatus =
  | {
      response: string;
      pipeTemplate?: object;
      config: Config;
      pkgVersion: PkgVersion[];
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
  response: string;
};
export type CovectorPublish = {
  commandsRan: CommandsRan;
  pipeTemplate: object;
  response: string;
};

export type Covector = {
  init: { response: string };
  add: { response: "complete" | "skipped" };
  config: { response: string };
  status: CovectorStatus;
  version: CovectorVersion;
  preview: CovectorPublish | { response: string };
  publish: CovectorPublish;
  arbitrary: CovectorPublish | { response: string };
};

export interface FunctionPipe extends PkgPublish {
  pkgCommandsRan: PkgCommandsRan;
}
