/**
 * One-time, dismissible hint shown while the active profile is the
 * first-run default ("My profile"): everything already works, and the link
 * leads to the athlete page to add thresholds and weight.
 */
import { Link } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { useDefaultProfileNotice } from "./use-default-profile-notice";

export function DefaultProfileNotice() {
  const t = useTranslate("athlete");
  const { visible, dismiss } = useDefaultProfileNotice();
  if (!visible) return null;
  return (
    <div
      data-testid="default-profile-notice"
      className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-edge-soft bg-surface p-3.5 text-[13px] text-ink-body"
    >
      <p className="flex-1">{t("defaultProfile.notice")}</p>
      <Link
        href="/athlete"
        className="text-xs font-medium text-ink-strong underline underline-offset-2"
      >
        {t("defaultProfile.complete")}
      </Link>
      <button
        type="button"
        onClick={dismiss}
        className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink-strong"
      >
        {t("defaultProfile.dismiss")}
      </button>
    </div>
  );
}
