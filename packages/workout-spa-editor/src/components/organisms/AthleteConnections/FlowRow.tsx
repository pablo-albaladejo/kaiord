import { Icon, ICON_MAP } from "../../atoms/Icon";
import { Toggle } from "../../atoms/Toggle";
import type { ConnectionFlow } from "./connection-config";

type FlowRowProps = {
  flow: ConnectionFlow;
  checked: boolean;
  onToggle: (next: boolean) => void;
};

export function FlowRow({ flow, checked, onToggle }: FlowRowProps) {
  const isImport = flow.direction === "import";
  const tile = isImport
    ? "bg-emerald-400/10 text-emerald-400"
    : "bg-sky-400/10 text-sky-400";

  return (
    <div className="flex items-center gap-3 py-2">
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
      <Toggle
        checked={checked}
        onCheckedChange={onToggle}
        aria-label={flow.label}
      />
    </div>
  );
}
