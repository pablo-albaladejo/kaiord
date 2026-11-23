import { lazyImport } from "../../../lib/lazy-import";

/**
 * Train2Go's HTML parsers, loaded on the first read instead of with the App:
 * the coaching transport is built at boot, and its reads would otherwise
 * carry every parser into the initial JS (FORBIDDEN_LAZY_SOURCES in
 * scripts/check-spa-initial-js.mjs).
 */
export const loadTrain2GoAnswers = () =>
  lazyImport(() => import("./read-train2go-answers"));
