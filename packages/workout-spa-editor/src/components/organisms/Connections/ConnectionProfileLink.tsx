import { useCoachingActivities } from "../../../hooks/use-coaching-activities";
import { useTranslate } from "../../../i18n/use-translate";
import { Pill } from "../../atoms/Pill";

type Props = { sourceId: string; name: string };

const NO_DAYS: string[] = [];

/**
 * A coaching source is linked per athlete profile, not per browser: the card's
 * "Connected" only says the extension has a session. When the active profile
 * has no link yet, say so and offer the link here — the calendar is otherwise
 * the only place it can be made.
 */
export function ConnectionProfileLink({ sourceId, name }: Props) {
  const t = useTranslate("connections");
  const { syncSources } = useCoachingActivities(NO_DAYS);
  const source = syncSources.find((s) => s.id === sourceId);
  if (!source || source.linked) return null;

  return (
    <div
      data-testid={`connection-profile-link-${sourceId}`}
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-edge bg-surface-elevated px-3 py-2 text-[12px] text-ink-strong"
    >
      <span>{t("profileLink.notLinked", { name })}</span>
      <button type="button" onClick={() => void source.connect()}>
        <Pill tone="accent" icon="link">
          {t("profileLink.link")}
        </Pill>
      </button>
    </div>
  );
}
