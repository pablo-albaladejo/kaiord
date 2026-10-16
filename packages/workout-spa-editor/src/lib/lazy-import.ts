import { trackLeaveDuring } from "./leave-tracking";

/**
 * A dynamic `import()` for code loaded on first use, outside the initial JS.
 *
 * It is watched for a leave like every lazy page (see `leave-tracking`), so
 * Firefox cancelling it for a navigation the user started is not answered
 * with a reload. And it always rejects on failure: `main.tsx` prevents
 * `vite:preloadError`, so a failed import whose reload is held back
 * resolves to `undefined` instead, which callers would otherwise
 * destructure into an unrelated TypeError. The message matches
 * `isChunkLoadError`, so it is handled like any other chunk failure.
 */
export const lazyImport = async <T>(load: () => Promise<T>): Promise<T> => {
  const module = await trackLeaveDuring(load);
  if (module === undefined)
    throw new Error(
      "lazy import failed: dynamically imported module unavailable"
    );
  return module;
};
