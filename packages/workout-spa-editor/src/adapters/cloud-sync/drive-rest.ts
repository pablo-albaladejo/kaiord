/**
 * Drive REST file I/O
 *
 * The four-endpoint Drive surface the cloud-sync adapter needs, over
 * `fetch` (no Google SDK): locate-or-create `kaiord-snapshot.json` in
 * `appDataFolder`, multipart-create or media-PATCH it, and `alt=media`
 * download it. No merge logic — pure file transport. The access token is
 * supplied per call via the injected getter so refresh stays the auth
 * layer's concern.
 */

import type { RemoteSnapshot, Snapshot } from "../../types/snapshot";
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
  upload: (snapshot: Snapshot) => Promise<string>;
};

export function createDriveRest(getToken: () => string | null): DriveRest {
  const authHeader = () => {
    const token = getToken();
    if (!token) throw new Error("Drive request attempted without a token");
    return { Authorization: `Bearer ${token}` };
  };

  const asJson = async <T>(res: Response): Promise<T> => {
    if (!res.ok) throw new Error(`Drive API error ${res.status}`);
    return (await res.json()) as T;
  };

  const findFile = async (): Promise<DriveFile | null> => {
    const res = await fetch(findUrl(), { headers: authHeader() });
    const body = await asJson<{ files: DriveFile[] }>(res);
    return body.files[0] ?? null;
  };

  const download = async (): Promise<RemoteSnapshot | null> => {
    const file = await findFile();
    if (!file) return null;
    const res = await fetch(mediaUrl(file.id), { headers: authHeader() });
    const snapshot = await asJson<Snapshot>(res);
    return { snapshot, headRevisionId: file.headRevisionId ?? "" };
  };

  const upload = async (snapshot: Snapshot): Promise<string> => {
    const file = await findFile();
    const res = file
      ? await fetch(updateUrl(file.id), {
          method: "PATCH",
          headers: { ...authHeader(), "Content-Type": "application/json" },
          body: JSON.stringify(snapshot),
        })
      : await fetch(createUrl(), {
          method: "POST",
          headers: { ...authHeader(), "Content-Type": MULTIPART_CONTENT_TYPE },
          body: buildMultipartBody(SNAPSHOT_FILE_NAME, snapshot),
        });
    const body = await asJson<DriveFile>(res);
    return body.headRevisionId ?? "";
  };

  return { download, upload };
}
