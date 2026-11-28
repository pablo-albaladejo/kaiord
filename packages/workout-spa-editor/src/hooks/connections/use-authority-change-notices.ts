/**
 * Watches what decides each kind for the active athlete and hands each new
 * Authority to `show`, once: what the athlete was told is written to their
 * preferences row (synced, so another device does not repeat it), and a
 * session memo covers the moment before that write is read back. Waits for
 * the athlete's Capabilities, so a matrix choice still loading is never read
 * as Kaiord's.
 */
import { useEffect, useRef } from "react";

import {
  type AuthorityChangeNotice,
  authorityChanges,
} from "../../application/connections/authority-change";
import { buildDataTypeRoutingRows } from "../../application/connections/data-type-routing";
import { AUTHORITY_MATRIX_ID } from "../../application/data-source-policy/automatic-authority";
import { choicesInForce } from "../../application/data-source-policy/read-authority-choice";
import { useCapabilities } from "../../contexts/capabilities-context";
import { logger } from "../../utils/logger";
import { useActiveProfileLive } from "../use-active-profile-live";
import { useSetUserPreferenceFields } from "../use-set-user-preference-fields";
import { useAuthorityInputsLive } from "./use-authority-inputs-live";

const keyOf = (profileId: string, notice: AuthorityChangeNotice): string =>
  [profileId, notice.decides, ...notice.dataTypes].join(":");

export const useAuthorityChangeNotices = (
  show: (notice: AuthorityChangeNotice) => void
): void => {
  const profileId = useActiveProfileLive()?.id ?? null;
  const inputs = useAuthorityInputsLive(profileId);
  const capabilities = useCapabilities();
  const ready = capabilities.status === "ready";
  const matrixOn = capabilities.isOn(AUTHORITY_MATRIX_ID);
  const setPrefs = useSetUserPreferenceFields(profileId);
  const told = useRef(new Set<string>());

  useEffect(() => {
    if (!ready || inputs === undefined || profileId === null) return;
    const rows = buildDataTypeRoutingRows(
      inputs.byDataType,
      choicesInForce(inputs.stored, matrixOn)
    );
    const { notices, seen, changed } = authorityChanges(rows, inputs.seen);
    if (!changed) return;
    void setPrefs({ authorityDeciders: seen }).catch((error: unknown) => {
      logger.warn("Failed to remember the Authority notice", { error });
    });
    for (const notice of notices) {
      const key = keyOf(profileId, notice);
      if (told.current.has(key)) continue;
      told.current.add(key);
      show(notice);
    }
  }, [ready, inputs, profileId, matrixOn, setPrefs, show]);
};
