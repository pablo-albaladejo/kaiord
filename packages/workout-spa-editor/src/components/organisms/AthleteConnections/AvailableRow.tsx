import { useLocation } from "wouter";

import { Pill } from "../../atoms/Pill";
import type { ConnectionConfig } from "./connection-config";
import { ConnectionMark } from "./ConnectionMark";

type AvailableRowProps = {
  config: ConnectionConfig;
};

/* Real OAuth/connect for these brands is not yet supported. The Connect
   action routes to the Extensions settings where bridges are managed. */
export function AvailableRow({ config }: AvailableRowProps) {
  const [, navigate] = useLocation();

  return (
    <button
      type="button"
      onClick={() => navigate("/settings/extensions")}
      className="flex w-full items-center gap-3 rounded-2xl border border-slate-700/60 bg-surface p-3 text-left"
    >
      <ConnectionMark mark={config.mark} />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold text-slate-50">
          {config.name}
        </div>
        <div className="text-[12.5px] text-slate-500">Not connected</div>
      </div>
      <Pill tone="accent" icon="plus">
        Connect
      </Pill>
    </button>
  );
}
