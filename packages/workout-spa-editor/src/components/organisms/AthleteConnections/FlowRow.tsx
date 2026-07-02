import { Icon, ICON_MAP } from "../../atoms/Icon";
import { Pill } from "../../atoms/Pill";
import { Toggle } from "../../atoms/Toggle";
import type { ConnectionFlow } from "./connection-config";
import type { FlowAvailability } from "./flow-availability";

type FlowRowProps = {
  flow: ConnectionFlow;
  availability: FlowAvailability;
  checked: boolean;
  onToggle: (next: boolean) => void;
};

/* Only "operational" flows get an interactive toggle. "manual" and
   "coming-soon" flows have no real backend on the connected bridge (see
   flow-availability.ts) and render as a disabled badge instead — never a
   toggle that implies a sync which doesn't actually happen. */
export function FlowRow({
  flow,
  availability,
  checked,
  onToggle,
}: FlowRowProps) {
  const isImport = flow.direction === "import";
  const isOperational = availability === "operational";
  const tile = isImport
    ? "bg-emerald-400/10 text-emerald-400"
    : "bg-sky-400/10 text-sky-400";

  return (
    <div
      className={`flex items-center gap-3 py-2 ${isOperational ? "" : "opacity-70"}`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tile}`}
      >
        <Icon
          icon={ICON_MAP[isImport ? "arrowDown" : "arrowUp"]}
          size="sm"
          color="inherit"
          strokeWidth={2}
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-medium text-slate-100">
          {flow.label}
        </div>
        <div className="text-[12px] text-slate-500">{flow.sublabel}</div>
      </div>
      {isOperational ? (
        <Toggle
          checked={checked}
          onCheckedChange={onToggle}
          aria-label={flow.label}
        />
      ) : (
        <Pill tone="neutral">
          {availability === "manual" ? "Manual (import FIT)" : "Coming soon"}
        </Pill>
      )}
    </div>
  );
}
