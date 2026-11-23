/**
 * Whether a location falls under a route a Capability owns, read the way the
 * router reads it, so no spelling of a path reaches an off Capability's
 * screen. wouter decodes escape sequences (`decodeURI`, kept as-is when it
 * cannot be decoded) and matches every pattern case-insensitively with an
 * optional trailing slash (regexparam's `i` flag); the App's fragment
 * location carries the query, and a stray `#` reaches no route at all.
 */

const decoded = (path: string): string => {
  try {
    return path.includes("%") ? decodeURI(path) : path;
  } catch {
    return path;
  }
};

/** The path the router matches: decoded, without query or hash, lower case. */
export const routerPath = (location: string): string =>
  (decoded(location).split(/[?#]/, 1)[0] ?? "").toLowerCase();

/** `prefix` itself, or anything below it, as the router would match it. */
export const isUnderRoute = (prefix: string, location: string): boolean => {
  const path = routerPath(location);
  const owned = prefix.toLowerCase();
  return path === owned || path.startsWith(`${owned}/`);
};
