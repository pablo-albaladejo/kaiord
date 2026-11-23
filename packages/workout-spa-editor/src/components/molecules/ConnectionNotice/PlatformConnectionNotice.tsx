import type { ConnectionState } from "@kaiord/i18n";

import { connectionFixHref } from "../../../application/connections/connection-fix-target";
import { ConnectionNotice } from "./ConnectionNotice";
import { useConnectionNotice } from "./use-connection-notice";

type Props = {
  bridgeId: string;
  /** The Platform's name as the registry spells it. */
  platform: string;
  connection: ConnectionState;
  /** Re-runs the check; without it a "try-again" notice names its fix and
      leaves the control that failed as the way to try again. */
  onRetry?: () => void;
  testId?: string;
};

/** One Platform's Connection notice, wherever that Platform is used. */
export function PlatformConnectionNotice({
  bridgeId,
  platform,
  connection,
  onRetry,
  testId,
}: Props) {
  const notice = useConnectionNotice(connection, platform);
  if (notice === null) return null;

  return (
    <ConnectionNotice
      notice={notice}
      href={connectionFixHref(notice.fix, bridgeId)}
      onRetry={onRetry}
      testId={testId}
    />
  );
}
