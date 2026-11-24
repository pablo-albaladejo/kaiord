/**
 * The shared Connection notices, loaded on first need instead of at boot.
 *
 * Their table (`@kaiord/i18n/connection-notices`) is built when its module
 * loads and carries every wording in both languages. App-wide chrome (the
 * header pill) only words a notice once a Connection needs attention, so it
 * loads the table then. A page that shows notices on every render imports
 * them statically: it is a lazy chunk already.
 */
import type * as NoticesModule from "@kaiord/i18n/connection-notices";
import { useEffect, useState } from "react";

import { lazyImport } from "../lib/lazy-import";

export type ConnectionNotices = typeof NoticesModule;

let loaded: ConnectionNotices | null = null;

/** The notices module; rejects when its chunk cannot be fetched. */
export const loadConnectionNotices = async (): Promise<ConnectionNotices> => {
  loaded ??= await lazyImport(() => import("@kaiord/i18n/connection-notices"));
  return loaded;
};

/**
 * The notices once `enabled` has asked for them and they have loaded,
 * `null` before (or if their chunk could not be fetched).
 */
export const useConnectionNotices = (
  enabled: boolean
): ConnectionNotices | null => {
  const [notices, setNotices] = useState(loaded);
  useEffect(() => {
    if (!enabled || notices) return;
    let live = true;
    loadConnectionNotices().then(
      (module) => {
        if (live) setNotices(module);
      },
      () => undefined
    );
    return () => {
      live = false;
    };
  }, [enabled, notices]);
  return notices;
};
