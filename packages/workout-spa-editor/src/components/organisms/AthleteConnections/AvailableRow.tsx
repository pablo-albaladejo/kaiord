import { useLocation } from "wouter";

import { Pill } from "../../atoms/Pill";
import type { ConnectionConfig } from "./connection-config";
import { ConnectionMark } from "./ConnectionMark";

type AvailableRowProps = {
  config: ConnectionConfig;
};

/* Real per-brand OAuth/connect is not yet supported, so the row makes a
   generic promise: it routes to the Extensions settings where bridges are
   managed rather than implying a direct one-tap connect for this brand. */
export function AvailableRow({ config }: AvailableRowProps) {
  const [, navigate] = useLocation();

  return (
    <button
      type="button"
      onClick={() => navigate("/settings/extensions")}
      aria-label={`Manage ${config.name} in Extensions settings`}
      className="flex w-full items-center gap-3 rounded-2xl border border-slate-700/60 bg-surface p-3 text-left"
    >
      <ConnectionMark mark={config.mark} />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold text-slate-50">
          {config.name}
        </div>
        <div className="text-[12.5px] text-slate-500">Not connected</div>
      </div>
      <Pill tone="accent" icon="link">
        Manage
      </Pill>
    </button>
  );
}
