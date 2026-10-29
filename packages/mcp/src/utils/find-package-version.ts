import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";

const PACKAGE_NAME = "@kaiord/mcp";
const UNKNOWN_VERSION = "0.0.0";
const MAX_PARENT_LEVELS = 4;

type PackageJson = { name?: string; version?: string };

const readPackageJson = (dir: string): PackageJson | null => {
  const path = join(dir, "package.json");
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8")) as PackageJson;
};

// dist/ holds a stub package.json (`{ "type": "module" }`), so the walk
// skips any manifest that is not this package's own.
export const findPackageVersion = (baseDir: string): string => {
  let dir = baseDir;
  for (let level = 0; level <= MAX_PARENT_LEVELS; level++) {
    const pkg = readPackageJson(dir);
    if (pkg?.name === PACKAGE_NAME && pkg.version) return pkg.version;
    dir = dirname(dir);
  }
  return UNKNOWN_VERSION;
};
