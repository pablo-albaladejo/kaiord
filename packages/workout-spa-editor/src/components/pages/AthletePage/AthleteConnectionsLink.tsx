import { Link } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { sourceDisplayName } from "../../../lib/athlete/source-name";
import type { Profile } from "../../../types/profile";
import { Icon, ICON_MAP } from "../../atoms/Icon";

const CONNECTIONS_HREF = "/settings/connections";

type AthleteConnectionsLinkProps = {
  profile: Profile;
};

/* One concept, one place (principle 5): the sources feeding this profile are
   managed in Connections, so this states what feeds it and points there
   rather than growing a second connections list here. Nothing renders when
   no account is linked — there is no relationship to describe. */
export function AthleteConnectionsLink({
  profile,
}: AthleteConnectionsLinkProps) {
  const t = useTranslate("athlete");
  const sources = profile.linkedAccounts.map((account) =>
    sourceDisplayName(account.source)
  );
  if (sources.length === 0) return null;

  return (
    <Link
      href={CONNECTIONS_HREF}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-edge-soft bg-surface p-4 transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] hover:border-edge-strong"
    >
      <span className="min-w-0 flex-1 basis-[260px] text-[13px] font-medium text-ink-strong">
        {t("connections.fedBy", { source: sources.join(" · ") })}
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
