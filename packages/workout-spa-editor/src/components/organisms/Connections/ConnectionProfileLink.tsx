import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useCoachingActivities } from "../../../hooks/use-coaching-activities";
import { useTranslate } from "../../../i18n/use-translate";
import { Pill } from "../../atoms/Pill";
import { ConnectionProfileLinked } from "./ConnectionProfileLinked";

type Props = {
  sourceId: string;
  name: string;
  /** The card can offer a new link only while the source's extension is
      here and serves planned sessions; an existing link is shown regardless. */
  canLink: boolean;
};

const NO_DAYS: string[] = [];

/**
 * A coaching source is linked per athlete profile, not per browser: the card's
 * "Connected" only says the extension is present. A link is stored on the
 * profile and syncs with it, so it is stated — and can be undone — even where
 * the extension is missing. Without one, say so and offer the link here.
 *
 * The linked check reads the profile alone, so the linked case never mounts
 * the coaching source; only the notice does, for the source's session state
 * and its connect, which is the calendar's own link flow.
 */
export function ConnectionProfileLink({ sourceId, name, canLink }: Props) {
  const live = useActiveProfileLive();
  const profile = live?.profile;
  if (!profile) return null;
  const linked = profile.linkedAccounts.find((a) => a.source === sourceId);
  if (linked)
    return <ConnectionProfileLinked profile={profile} link={linked} />;
  if (!canLink) return null;
  return <UnlinkedProfileNotice sourceId={sourceId} name={name} />;
}

function UnlinkedProfileNotice({
  sourceId,
  name,
}: Pick<Props, "sourceId" | "name">) {
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
