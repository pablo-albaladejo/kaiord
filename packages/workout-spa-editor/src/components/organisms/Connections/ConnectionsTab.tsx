import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useConnectionSources } from "../../../hooks/connections/use-connection-sources";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import { useDataFlows } from "../ProfileManager/components/useDataFlows";
import { ConnectionsHealth } from "./ConnectionsHealth";
import { ConnectionSourceCard } from "./ConnectionSourceCard";
import { ConnectionsUnsupported } from "./ConnectionsUnsupported";
import { DataTypeRoutingSection } from "./DataTypeRoutingSection";

const isUnsupported = (source: ConnectionSource): boolean =>
  source.status === "unsupported";

export const ConnectionsTab: React.FC = () => {
  const t = useTranslate("connections");
  const active = useActiveProfileLive();
  const profileId = active?.id ?? null;
  const sources = useConnectionSources(profileId);
  // One read of the policy rows for the whole page: every Disconnect needs
  // the bridge's policies, and a per-card hook would run 13 queries per card.
  const { byDataType } = useDataFlows(profileId ?? "");

  if (profileId === null) {
    return (
      <p
        className="text-sm text-ink-muted"
        data-testid="connections-no-profile"
      >
        {t("noProfile")}
      </p>
    );
  }

  return (
    <div className="space-y-5" data-testid="connections-tab">
      <ConnectionsHealth sources={sources} byDataType={byDataType} />
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
            {t("sources")}
          </h2>
          <span className="text-[12.5px] text-ink-muted">
            {t("sourcesHint")}
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {sources
            .filter((source) => !isUnsupported(source))
            .map((source) => (
              <ConnectionSourceCard
                key={source.id}
                source={source}
                profileId={profileId}
                byDataType={byDataType}
              />
            ))}
        </div>
      </section>
      <DataTypeRoutingSection profileId={profileId} byDataType={byDataType} />
      <ConnectionsUnsupported sources={sources.filter(isUnsupported)} />
    </div>
  );
};
