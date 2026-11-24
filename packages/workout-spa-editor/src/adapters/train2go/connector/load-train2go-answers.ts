import { lazyImport } from "../../../lib/lazy-import";
import { AppPartNotLoadedError } from "../../../types/app-part-not-loaded-error";

/**
 * Train2Go's HTML parsers, loaded on the first read instead of with the App:
 * the coaching transport is built at boot, and its reads would otherwise
 * carry every parser into the initial JS (FORBIDDEN_LAZY_SOURCES in
 * scripts/check-spa-initial-js.mjs). If they cannot load, the read is never
 * sent, so Train2Go was never asked: the failure is the App's own.
 */
export const loadTrain2GoAnswers = () =>
  lazyImport(() => import("./read-train2go-answers")).catch(() => {
    throw new AppPartNotLoadedError();
  });
