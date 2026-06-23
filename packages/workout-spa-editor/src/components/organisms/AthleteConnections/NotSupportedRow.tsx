import type { ConnectionConfig } from "./connection-config";
import { ConnectionMark } from "./ConnectionMark";

type NotSupportedRowProps = {
  config: ConnectionConfig;
};

/* Honest state for brands without a connect mechanism yet (Strava, Wahoo):
   no Connect action, no fake OAuth, no deep-link masquerading as connect. */
export function NotSupportedRow({ config }: NotSupportedRowProps) {
  return (
    <div
      data-testid={`connection-${config.id}`}
      className="flex w-full items-center gap-3 rounded-2xl border border-slate-700/60 bg-surface p-3 opacity-70"
    >
      <ConnectionMark mark={config.mark} />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold text-slate-50">
          {config.name}
        </div>
        <div className="text-[12.5px] text-slate-500">Not supported yet</div>
      </div>
    </div>
  );
}
