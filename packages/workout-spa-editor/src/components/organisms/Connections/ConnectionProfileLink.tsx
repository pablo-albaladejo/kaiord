import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useCoachingActivities } from "../../../hooks/use-coaching-activities";
import { useTranslate } from "../../../i18n/use-translate";
import { Pill } from "../../atoms/Pill";

type Props = { sourceId: string; name: string };

const NO_DAYS: string[] = [];

/**
 * A coaching source is linked per athlete profile, not per browser: the card's
 * "Connected" only says the extension is present. When the active profile has
 * no link yet, say so and offer the link here — the calendar is otherwise the
 * only place it can be made.
 *
 * The linked check reads the profile alone, so the common, linked case never
 * mounts the coaching source; only the notice does, for the source's session
 * state and its connect, which is the calendar's own link flow.
 */
export function ConnectionProfileLink({ sourceId, name }: Props) {
  const live = useActiveProfileLive();
  const profile = live?.profile;
  if (!profile) return null;
  if (profile.linkedAccounts.some((a) => a.source === sourceId)) return null;
  return <UnlinkedProfileNotice sourceId={sourceId} name={name} />;
}

function UnlinkedProfileNotice({ sourceId, name }: Props) {
  const t = useTranslate("connections");
  const { syncSources } = useCoachingActivities(NO_DAYS);
  const source = syncSources.find((s) => s.id === sourceId);
  if (!source) return null;

  return (
    <div
      data-testid={`connection-profile-link-${sourceId}`}
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-edge bg-surface-elevated px-3 py-2 text-[12px] text-ink-strong"
    >
      <span>
        {t(source.connected ? "profileLink.notLinked" : "profileLink.signIn", {
          name,
        })}
      </span>
      {source.error && (
        <span role="alert" className="text-danger-text">
          {source.error}
        </span>
      )}
      {source.connected && (
        <button
          type="button"
          disabled={source.loading}
          aria-busy={source.loading}
          onClick={() => void source.connect()}
        >
          <Pill tone="accent" icon="link">
            {t(source.loading ? "profileLink.linking" : "profileLink.link")}
          </Pill>
        </button>
      )}
    </div>
  );
}
