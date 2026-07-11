import { Pill } from "../../atoms/Pill";
import type { ConnectionConfig } from "./connection-config";
import { ConnectionMark } from "./ConnectionMark";

type ApiKeyRowHeaderProps = {
  config: ConnectionConfig;
  connected: boolean;
  showForm: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function ApiKeyRowHeader({
  config,
  connected,
  showForm,
  onConnect,
  onDisconnect,
}: ApiKeyRowHeaderProps) {
  return (
    <div className="flex w-full items-center gap-3">
      <ConnectionMark mark={config.mark} />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold text-ink-strong">
          {config.name}
        </div>
        <div
          className={`text-[12.5px] ${connected ? "text-emerald-400" : "text-ink-muted"}`}
        >
          {connected ? "Connected" : "Not connected"}
        </div>
      </div>
      {connected && (
        <button type="button" onClick={onDisconnect}>
          <Pill tone="neutral" icon="link">
            Disconnect
          </Pill>
        </button>
      )}
      {!connected && !showForm && (
        <button
          type="button"
          aria-label={`Connect ${config.name}`}
          onClick={onConnect}
        >
          <Pill tone="accent" icon="link">
            Connect
          </Pill>
        </button>
      )}
    </div>
  );
}
