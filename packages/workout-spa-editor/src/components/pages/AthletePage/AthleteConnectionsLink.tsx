import { Link } from "wouter";

import { sourceIsConnected } from "../../../application/connections/connection-source";
import { useConnectionSources } from "../../../hooks/connections/use-connection-sources";
import { useDiscoverySettled } from "../../../hooks/connections/use-discovery-settled";
import { useTranslate } from "../../../i18n/use-translate";
import { sourceDisplayName } from "../../../lib/athlete/source-name";
import { CONNECTIONS_PATH } from "../../../routing/constants";
import type { Profile } from "../../../types/profile";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { Pill } from "../../atoms/Pill";

type AthleteConnectionsLinkProps = {
  profile: Profile;
};

type Chip = { id: string; name: string };

/* One concept, one place: the sources feeding this athlete are managed in
   Connections, so this names them and points there rather than growing a
   second connections list here. Every source counts — a connected one in
   this browser, or a coaching account linked on the athlete itself, which
   syncs and so can be linked from another device. */
export function AthleteConnectionsLink({
  profile,
}: AthleteConnectionsLinkProps) {
  const t = useTranslate("athlete");
  const tConnections = useTranslate("connections");
  const sources = useConnectionSources(profile.id);
  // Until an extension announces, every bridge reads "available": say nothing
  // about "none" before discovery has had its window.
  const settled = useDiscoverySettled(
    sources.filter((source) => source.bridgeDetected).length
  );
  const chips: Chip[] = sources
    .filter(sourceIsConnected)
    .map(({ id, name }) => ({ id, name }));
  for (const account of profile.linkedAccounts) {
    if (chips.some((chip) => chip.id === account.source)) continue;
    const name = sourceDisplayName(account.source, tConnections);
    chips.push({ id: account.source, name });
  }

  return (
    <Link
      href={CONNECTIONS_PATH}
      data-testid="athlete-connections-link"
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-edge-soft bg-surface p-4 transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] hover:border-edge-strong"
    >
      <span className="flex min-w-0 flex-1 basis-[260px] flex-wrap items-center gap-2 text-[13px] font-medium text-ink-strong">
        {t("connections.title")}
        {chips.length === 0
          ? settled && (
              <span className="font-normal text-ink-muted">
                {t("connections.none")}
              </span>
            )
          : chips.map((chip) => (
              <Pill
                key={chip.id}
                data-testid={`athlete-connection-chip-${chip.id}`}
              >
                {chip.name}
              </Pill>
            ))}
      </span>
      <span className="flex shrink-0 items-center gap-[7px] text-[13px] font-medium text-ink-body">
        {t("connections.manage")}
        <Icon
          icon={ICON_MAP.chevR}
          size="xs"
          color="inherit"
          strokeWidth={2.25}
        />
      </span>
    </Link>
  );
}
