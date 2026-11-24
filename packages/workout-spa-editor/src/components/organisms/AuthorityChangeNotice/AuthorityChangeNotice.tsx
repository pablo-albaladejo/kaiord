import { useCallback } from "react";
import { Link } from "wouter";

import type { AuthorityChangeNotice as Notice } from "../../../application/connections/authority-change";
import { AUTHORITY_MATRIX_ID } from "../../../application/data-source-policy/automatic-authority";
import { useCapabilities } from "../../../contexts/capabilities-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useAuthorityChangeNotices } from "../../../hooks/connections/use-authority-change-notices";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import { capabilityHome } from "../../../lib/capabilities/capability-catalogue";
import { CONNECTIONS_PATH } from "../../../routing/constants";
import { sourceName } from "../Connections/routing-copy";

const NOTICE_MS = 12_000;

const ACTION =
  "rounded-md bg-white/10 px-3 py-1 text-sm font-medium transition-colors hover:bg-white/20";

/**
 * One notice when a Platform the athlete connects starts deciding a kind
 * another Platform was deciding: what changes, and one link to where it can
 * be changed (the kind's Connections row, or the matrix while it is on). No
 * dialog: Kaiord decides and offers the way back (ADR 0003).
 */
export function AuthorityChangeNotice() {
  const toasts = useToastContext();
  const t = useTranslate("connections");
  const locale = useActiveLocale();
  const matrixOn = useCapabilities().isOn(AUTHORITY_MATRIX_ID);

  const show = useCallback(
    (notice: Notice) => {
      const kinds = new Intl.ListFormat(locale, {
        type: "conjunction",
      }).format(notice.dataTypes.map((k) => t(`authorityNotice.kinds.${k}`)));
      const href = matrixOn
        ? capabilityHome(AUTHORITY_MATRIX_ID)
        : `${CONNECTIONS_PATH}?kind=${notice.dataTypes[0]}`;
      toasts.info(
        t("authorityNotice.decides", {
          decides: sourceName(notice.decides, t),
          replaces: sourceName(notice.replaces, t),
          kinds,
        }),
        undefined,
        {
          duration: NOTICE_MS,
          action: (
            <Link
              href={href}
              className={ACTION}
              data-testid="authority-notice-change"
            >
              {t("authorityNotice.change")}
            </Link>
          ),
        }
      );
    },
    [toasts, t, locale, matrixOn]
  );

  useAuthorityChangeNotices(show);
  return null;
}
