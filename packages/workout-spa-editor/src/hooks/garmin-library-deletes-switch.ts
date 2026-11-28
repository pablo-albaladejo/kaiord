/**
 * Whether the production placement pipeline deletes, from the athlete's
 * Garmin library, an earlier version Kaiord created (`cleanLibrary`). It is
 * off: Kaiord reads only the months where it placed a version, and if Garmin
 * deletes a library workout's calendar entries with it, an entry the athlete
 * put in another month would go too. It may be turned on only by the owner,
 * after a live capture shows how Garmin answers that delete and lists its
 * library, and together with the extension's closed-list entry for the
 * delete and the public texts that describe it.
 */
export const GARMIN_LIBRARY_DELETES = false;
