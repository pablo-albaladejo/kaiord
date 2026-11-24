import type { ConnectionState } from "@kaiord/i18n/connection-notices";

import { useGarminBridge } from "../../../contexts";
import { PlatformConnectionNotice } from "./PlatformConnectionNotice";

type Props = { connection: ConnectionState; testId?: string };

/** The Garmin Connection's notice, wherever a send to Garmin is offered;
    "try-again" re-runs the Garmin check. */
export function GarminConnectionNotice({ connection, testId }: Props) {
  const { detectExtension } = useGarminBridge();
  return (
    <PlatformConnectionNotice
      bridgeId="garmin-bridge"
      platform="Garmin"
      connection={connection}
      onRetry={() => void detectExtension()}
      testId={testId ?? "garmin-connection-notice"}
    />
  );
}
