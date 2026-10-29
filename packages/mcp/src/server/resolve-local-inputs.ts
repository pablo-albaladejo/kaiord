import { dirname } from "path";
import { fileURLToPath } from "url";

import { findPackageVersion } from "../utils/find-package-version";
import { findSchemaFile } from "../utils/find-schema-file";
import { findSpecFile } from "../utils/find-spec-file";

export type LocalInputs = {
  readonly version: string;
  readonly formatSpec: string;
  readonly krdSchema: string;
};

export const resolveLocalInputs = (
  moduleUrl: string = import.meta.url
): LocalInputs => {
  const baseDir = dirname(fileURLToPath(moduleUrl));
  return {
    version: findPackageVersion(baseDir),
    formatSpec: findSpecFile(baseDir),
    krdSchema: findSchemaFile(),
  };
};
