import { useState } from "react";

import { unlinkAccount } from "../../../application/coaching/unlink-account";
import { useAnalytics } from "../../../contexts";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import type { LinkedCoachingAccount } from "../../../types/coaching-account";
import type { Profile } from "../../../types/profile";

type Props = { profile: Profile; link: LinkedCoachingAccount };

/* The one connection that is not device-local: `linkedAccounts` lives on the
   profile and travels with it, so the notice says so. The toast names no
   account — the external user name is PII. */
export function ConnectionProfileLinked({ profile, link }: Props) {
  const t = useTranslate("connections");
  const persistence = usePersistence();
  const toasts = useToastContext();
  const analytics = useAnalytics();
  const [busy, setBusy] = useState(false);

  const unlink = async () => {
    setBusy(true);
    try {
      await unlinkAccount(persistence.profiles, profile.id, link.source);
      toasts.info(t("profileLink.unlinked"));
      analytics.event("coaching.unlink.success", { source: link.source });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid={`connection-profile-linked-${link.source}`}
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-edge-soft px-3 py-2 text-[12px] text-ink-body"
    >
      <span>{t("profileLink.linked", { user: link.externalUserName })}</span>
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={() => void unlink()}
        className="rounded-lg px-2 py-1 text-[12.5px] font-medium text-ink-strong hover:bg-surface-elevated disabled:opacity-50"
      >
        {t(busy ? "profileLink.unlinking" : "profileLink.unlink")}
      </button>
    </div>
  );
}
