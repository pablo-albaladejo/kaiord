import { connectionFixHref } from "../../../application/connections/connection-fix-target";
import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useConnectionsRefresh } from "../../../hooks/connections/use-connections-refresh";
import { useDiscoverySettled } from "../../../hooks/connections/use-discovery-settled";
import { ConnectionNotice } from "../../molecules/ConnectionNotice/ConnectionNotice";
import { useConnectionNotice } from "../../molecules/ConnectionNotice/use-connection-notice";

type Props = { source: ConnectionSource };

/**
 * The card's one notice. "Install" waits for discovery's window, by time
 * alone: another extension answering says nothing about this one, and an
 * installed extension that has not announced yet must never be told to
 * install itself.
 */
export function ConnectionCardNotice({ source }: Props) {
  const notice = useConnectionNotice(
    source.connection,
    source.name,
    source.reason ?? null
  );
  const settled = useDiscoverySettled(0);
  const refresh = useConnectionsRefresh();

  if (notice === null) return null;
  if (notice.fix === "install" && !settled) return null;

  return (
    <ConnectionNotice
      notice={notice}
      href={connectionFixHref(notice.fix, source.bridgeId)}
      onRetry={refresh.run}
      testId={`connection-notice-${source.id}`}
    />
  );
}
