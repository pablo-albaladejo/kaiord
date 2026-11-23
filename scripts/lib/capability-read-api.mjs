/**
 * What the Capability surfaces rules share: whether a path is inside a
 * declared module entry, and whether a scanned file asks the read API, which
 * only a value import does (a type-only import asks nothing).
 */

import { stripModule } from "./capability-source-imports.mjs";

/** Whether a src-relative path (with or without extension) is in a module entry. */
export const within = (path, entry) => {
  const bare = stripModule(path);
  return entry.endsWith("/")
    ? `${bare}/`.startsWith(entry)
    : bare === stripModule(entry);
};

export const readsApi = (file, vocab) =>
  file.imports.some(
    ({ target, typeOnly }) =>
      !typeOnly && vocab.READ_API.some((api) => within(target, api))
  );
