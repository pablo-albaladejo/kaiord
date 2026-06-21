import { Icon, ICON_MAP, type IconName } from "../../atoms/Icon";

export type PlannedMetaItem = {
  icon: IconName;
  value: string;
  label: string;
};

export type PlannedMetaProps = {
  items: PlannedMetaItem[];
};

export function PlannedMeta({ items }: PlannedMetaProps) {
  return (
    <div className="flex gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-1 items-center gap-2 rounded-md bg-white/5 px-3 py-2"
        >
          <Icon icon={ICON_MAP[item.icon]} size="sm" color="muted" />
          <div className="min-w-0">
            <div className="text-[14px] font-bold tabular-nums text-slate-50">
              {item.value}
            </div>
            <div className="text-[11px] text-slate-500">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
