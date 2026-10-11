/**
 * Shown when cloud sync found several real profiles in Drive while this
 * device still holds its unclaimed default profile. Sync pushes nothing
 * until the user picks which profile this device's data belongs to; the
 * pick is stored and the sync re-runs through the same pipeline.
 */
import { useState } from "react";

import { useSync } from "../../../contexts/sync-context";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";

export function ProfileChoiceBanner() {
  const t = useTranslate("settings");
  const { profileChoice, chooseProfile } = useSync();
  const [busy, setBusy] = useState(false);
  if (!profileChoice || profileChoice.length === 0) return null;

  const choose = async (id: string) => {
    setBusy(true);
    try {
      await chooseProfile(id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="profile-choice-title"
      data-testid="profile-choice-banner"
      className="mb-4 space-y-3 rounded-xl border border-edge-soft bg-surface p-3.5 text-[13px] text-ink-body"
    >
      <h2 id="profile-choice-title" className="font-medium text-ink-strong">
        {t("sync.profileChoice.title")}
      </h2>
      <p>{t("sync.profileChoice.body")}</p>
      <div className="flex flex-wrap gap-2">
        {profileChoice.map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => void choose(p.id)}
          >
            {p.name || t("sync.profileChoice.unnamed")}
          </Button>
        ))}
      </div>
    </section>
  );
}
