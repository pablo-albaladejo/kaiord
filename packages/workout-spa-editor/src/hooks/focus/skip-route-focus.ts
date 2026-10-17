/**
 * One-shot opt-out from `useFocusOnRouteChange`: for a route change that only
 * renames the current view (a chat draft gaining its persisted URL), not a
 * navigation the user should be moved to the heading for.
 */
let skipFocusForPath: string | null = null;

/** Leave focus where it is on the next arrival at `path`. */
export const skipRouteFocusFor = (path: string): void => {
  skipFocusForPath = path;
};

/** Whether this arrival at `pathname` was opted out. Clears the opt-out
 * either way, so it never outlives the next route change. */
export const consumeRouteFocusSkip = (pathname: string): boolean => {
  const skip = skipFocusForPath === pathname;
  skipFocusForPath = null;
  return skip;
};
