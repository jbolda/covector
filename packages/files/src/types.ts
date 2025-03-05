import type { TomlDocument } from "@covector/toml";
import type { LoadedFile } from "./schema";

interface NestedVersion {
  version?: string;
  [key: string]: any;
}
export type PkgFileVersion = string | NestedVersion;
export interface PkgTarget {
  dependencies?: Record<string, PkgFileVersion>;
  "dev-dependencies"?: Record<string, PkgFileVersion>;
  "build-dependencies"?: Record<string, PkgFileVersion>;
}

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

export interface PkgMinimum {
  version: string;
  currentVersion: string;
  pkg: Pkg | TomlDocument;
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
