/**
 * Drive REST file I/O
 *
 * The four-endpoint Drive surface the cloud-sync adapter needs, over
 * `fetch` (no Google SDK): locate-or-create `kaiord-snapshot.json` in
 * `appDataFolder`, multipart-create or media-PATCH it, and `alt=media`
 * download it. No merge logic — pure file transport. The injected fetch
 * adds the bearer token, so refresh stays the auth layer's concern.
 */

import type { RemoteSnapshot, Snapshot } from "../../types/snapshot";
import type { DriveFetch } from "./drive-authed-fetch";
import { buildMultipartBody, MULTIPART_CONTENT_TYPE } from "./drive-multipart";
import {
  createUrl,
  findUrl,
  mediaUrl,
  SNAPSHOT_FILE_NAME,
  updateUrl,
} from "./drive-rest-endpoints";

type DriveFile = { id: string; headRevisionId?: string };

export type DriveRest = {
  download: () => Promise<RemoteSnapshot | null>;
  upload: (
    snapshot: Snapshot,
    expectedRevision: string | null
  ) => Promise<string>;
};

export function createDriveRest(send: DriveFetch): DriveRest {
  const asJson = async <T>(res: Response): Promise<T> => {
    if (!res.ok) throw new Error(`Drive API error ${res.status}`);
    return (await res.json()) as T;
  };

  const findFile = async (): Promise<DriveFile | null> => {
    const res = await send(findUrl());
    const body = await asJson<{ files: DriveFile[] }>(res);
    return body.files[0] ?? null;
  };

  const download = async (): Promise<RemoteSnapshot | null> => {
    const file = await findFile();
    if (!file) return null;
    const res = await send(mediaUrl(file.id));
    const snapshot = await asJson<Snapshot>(res);
    return { snapshot, headRevisionId: file.headRevisionId ?? "" };
  };

  const upload = async (
    snapshot: Snapshot,
    expectedRevision: string | null
  ): Promise<string> => {
    const file = await findFile();
    // Optimistic concurrency: refuse to overwrite if the remote moved on
    // (or vanished/appeared) since the caller's last pull. syncWithCloud
    // catches this and re-pulls/re-merges before retrying.
    if ((file?.headRevisionId ?? null) !== expectedRevision) {
      throw new Error("Drive snapshot revision conflict");
    }
    const res = file
      ? await send(updateUrl(file.id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snapshot),
        })
      : await send(createUrl(), {
          method: "POST",
          headers: { "Content-Type": MULTIPART_CONTENT_TYPE },
          body: buildMultipartBody(SNAPSHOT_FILE_NAME, snapshot),
        });
    const body = await asJson<DriveFile>(res);
    return body.headRevisionId ?? "";
  };

  return { download, upload };
}
