/**
 * Drive multipart body builder
 *
 * Builds the `multipart/related` body Drive requires to create a file
 * with metadata (name + parent `appDataFolder`) and JSON content in a
 * single request. Update calls use a plain media PATCH and do not need
 * this.
 */

import type { Snapshot } from "../../types/snapshot";

const BOUNDARY = "kaiord-snapshot-boundary";

export const MULTIPART_CONTENT_TYPE = `multipart/related; boundary=${BOUNDARY}`;

export function buildMultipartBody(
  fileName: string,
  snapshot: Snapshot
): string {
  const metadata = { name: fileName, parents: ["appDataFolder"] };
  return [
    `--${BOUNDARY}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${BOUNDARY}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(snapshot),
    `--${BOUNDARY}--`,
    "",
  ].join("\r\n");
}
