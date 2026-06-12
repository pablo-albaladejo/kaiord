/**
 * Recognizes the Node.js error signatures that mean an installation/environment
 * problem rather than user error: an unresolvable runtime dependency
 * (`MODULE_NOT_FOUND`) or a missing bundled package asset (ENOENT on a path
 * inside `node_modules`). These surface when a bundled schema/validator
 * dependency cannot be loaded at runtime.
 */

const PACKAGE_ASSET_PATH_MARKER = "node_modules";

const getErrorCode = (error: unknown): string | undefined => {
  if (error && typeof error === "object" && "code" in error) {
    const { code } = error as { code: unknown };
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
};

const getErrorPath = (error: unknown): string | undefined => {
  if (error && typeof error === "object" && "path" in error) {
    const { path } = error as { path: unknown };
    return typeof path === "string" ? path : undefined;
  }
  return undefined;
};

/**
 * True when the error is a missing runtime dependency or a missing bundled
 * package asset — an installation problem the user fixes by reinstalling.
 */
export const isEnvironmentDependencyError = (error: unknown): boolean => {
  const code = getErrorCode(error);
  if (code === "MODULE_NOT_FOUND") return true;

  if (code === "ENOENT") {
    const path = getErrorPath(error);
    if (path?.includes(PACKAGE_ASSET_PATH_MARKER)) return true;
  }

  return false;
};
