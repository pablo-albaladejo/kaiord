/** Shared types for the user-initiated WHOOP labs import (design D6). */
import type { BiologicalSex } from "@kaiord/core";

import type { LabPersistence } from "../lab/lab-persistence";
import type { WhoopFetchResult } from "./whoop-fetch-result";

export type ImportWhoopLabsDeps = {
  persistence: LabPersistence;
  fetchLabs: (path: string) => Promise<WhoopFetchResult>;
  profileId: string;
  sex?: BiologicalSex;
  newId?: () => string;
};

export type ImportWhoopLabsResult =
  | { ok: true; imported: number; skipped: number }
  | { ok: false; reason: "transport-error"; error?: string };
