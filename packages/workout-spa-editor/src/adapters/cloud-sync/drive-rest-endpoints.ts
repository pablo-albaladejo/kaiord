/**
 * Drive REST endpoint helpers
 *
 * URL builders and the canonical snapshot file name for the Drive
 * `appDataFolder` I/O. Kept separate from `drive-rest.ts` to honor the
 * per-file line cap and to make the API surface obvious.
 */

export const SNAPSHOT_FILE_NAME = "kaiord-snapshot.json";

const FILES = "https://www.googleapis.com/drive/v3/files";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

/** Locate the single canonical file inside the hidden appData space. */
export function findUrl(): string {
  const params = new URLSearchParams({
    spaces: "appDataFolder",
    q: `name = '${SNAPSHOT_FILE_NAME}'`,
    fields: "files(id,headRevisionId)",
  });
  return `${FILES}?${params.toString()}`;
}

/** Download a file's bytes. */
export function mediaUrl(fileId: string): string {
  return `${FILES}/${fileId}?alt=media`;
}

/** Multipart create (metadata + body) in the appDataFolder. */
export function createUrl(): string {
  return `${UPLOAD}?uploadType=multipart&fields=headRevisionId`;
}

/** Media PATCH update of an existing file. */
export function updateUrl(fileId: string): string {
  return `${UPLOAD}/${fileId}?uploadType=media&fields=headRevisionId`;
}
