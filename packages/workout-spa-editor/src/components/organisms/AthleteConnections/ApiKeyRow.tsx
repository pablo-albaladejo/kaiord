import { useState } from "react";

import { useConnectionActions } from "../../../hooks/use-connection-actions";
import { ApiKeyConnectForm } from "./ApiKeyConnectForm";
import { ApiKeyRowHeader } from "./ApiKeyRowHeader";
import type { ConnectionConfig } from "./connection-config";
import { DisconnectConfirmation } from "./DisconnectConfirmation";

type ApiKeyRowProps = {
  profileId: string;
  config: ConnectionConfig;
  connected: boolean;
};

export function ApiKeyRow({ profileId, config, connected }: ApiKeyRowProps) {
  const { connect, disconnect } = useConnectionActions(profileId);
  const [showForm, setShowForm] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <div
      data-testid={`connection-${config.id}`}
      className="rounded-2xl border border-slate-700/60 bg-surface p-3"
    >
      <ApiKeyRowHeader
        config={config}
        connected={connected}
        showForm={showForm}
        onConnect={() => setShowForm(true)}
        onDisconnect={() => setConfirming(true)}
      />
      {!connected && showForm && (
        <ApiKeyConnectForm
          onConnect={async (key) => {
            await connect(config.id, "api-key", key);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
      <DisconnectConfirmation
        isOpen={confirming}
        message="This removes the stored API key for this connection."
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          void disconnect(config.id, "api-key", []);
          setConfirming(false);
        }}
      />
    </div>
  );
}
