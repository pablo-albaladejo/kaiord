import type { ConnectionFix } from "@kaiord/i18n";
import { useCallback } from "react";

import { connectionFixHref } from "../../../application/connections/connection-fix-target";

/**
 * Runs a notice's one fix from a button: the page it names opens in a new
 * tab, and "try-again" (or a fix with no page) re-runs the check.
 */
export const useConnectionFix = (
  bridgeId: string,
  retry: () => void
): ((fix: ConnectionFix) => void) =>
  useCallback(
    (fix) => {
      const href = connectionFixHref(fix, bridgeId);
      if (href === null) retry();
      else window.open(href, "_blank", "noopener,noreferrer");
    },
    [bridgeId, retry]
  );
