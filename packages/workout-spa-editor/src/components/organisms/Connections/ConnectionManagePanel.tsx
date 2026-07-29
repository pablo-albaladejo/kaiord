import { useState } from "react";

import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useBridgeImport } from "../../../hooks/connections/use-bridge-import";
import { useConnectionActions } from "../../../hooks/use-connection-actions";
import { useTranslate } from "../../../i18n/use-translate";
import { bridgePolicies } from "../AthleteConnections/data-flow-lookup";
import { DisconnectConfirmation } from "../AthleteConnections/DisconnectConfirmation";
import type { DataFlowsByType } from "../ProfileManager/components/useDataFlows";
import { ConnectionRouteList } from "./ConnectionRouteList";
import { ConnectionSyncButton } from "./ConnectionSyncButton";

type Props = {
  source: ConnectionSource;
  profileId: string;
  byDataType: DataFlowsByType;
};

/**
 * Disconnect is the same real unlink the Athlete page performs — it writes
 * the `disconnected` record and switches off every policy on the bridge. The
 * difference is that this page now READS that record, so the action finally
 * changes what the user sees.
 */
export function ConnectionManagePanel({
  source,
  profileId,
  byDataType,
}: Props) {
  const t = useTranslate("connections");
  const [confirming, setConfirming] = useState(false);
  const { disconnect } = useConnectionActions(profileId);
  const importState = useBridgeImport(source.bridgeId, profileId);

  return (
    <div className="space-y-3 border-t border-edge-soft pt-3">
      {source.mechanism === "bridge" && <ConnectionRouteList source={source} />}
      <div className="flex flex-wrap items-start gap-2">
        <ConnectionSyncButton sourceId={source.id} state={importState} />
        <button
          type="button"
          onClick={() => setConfirming(true)}
          data-testid={`connection-disconnect-${source.id}`}
          className="rounded-lg px-3 py-2 text-[12.5px] font-semibold text-red-600 dark:text-red-400"
        >
          {t("manage.disconnect")}
        </button>
      </div>
      <DisconnectConfirmation
        isOpen={confirming}
        message={t("manage.disconnectMessage")}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          void disconnect(
            source.id,
            source.mechanism,
            source.bridgeId === null
              ? []
              : bridgePolicies(byDataType, source.bridgeId)
          );
          setConfirming(false);
        }}
      />
    </div>
  );
}
