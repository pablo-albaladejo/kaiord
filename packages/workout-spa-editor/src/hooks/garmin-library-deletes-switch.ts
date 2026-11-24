/**
 * Whether the production placement pipeline deletes, from the athlete's
 * Garmin library, an earlier version Kaiord created (`cleanLibrary`). Off
 * by the owner's decision of 2026-11-24 (#1633): Kaiord reads only the
 * months where it placed a version, and if Garmin deletes a library
 * workout's calendar entries with it, an entry the athlete put in another
 * month would go too. The owner turns it on only after a live capture of
 * how Garmin answers that delete and lists its library (design "Library
 * deletes off until the owner's capture, 2026-11-24"), together with the
 * extension's closed-list entry and the public texts.
 */
export const GARMIN_LIBRARY_DELETES = false;
