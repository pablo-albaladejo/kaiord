import { Icon, ICON_MAP } from "../../atoms/Icon";
import {
  ACTIVE_STROKE_WIDTH,
  INACTIVE_STROKE_WIDTH,
  TAB_ICON_SIZE,
} from "./bottom-nav-styles";
import type { BottomNavTab as BottomNavTabModel } from "./bottom-nav-tabs";

type BottomNavTabProps = {
  tab: BottomNavTabModel;
  active: boolean;
  onActivate: (path: string) => void;
};

export function BottomNavTab({ tab, active, onActivate }: BottomNavTabProps) {
  const color = active ? "text-sky-400" : "text-slate-500";
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={() => onActivate(tab.path)}
      className={`flex flex-1 flex-col items-center gap-1 py-2 ${color}`}
    >
      <Icon
        icon={ICON_MAP[tab.icon]}
        color="inherit"
        strokeWidth={active ? ACTIVE_STROKE_WIDTH : INACTIVE_STROKE_WIDTH}
        style={{ width: TAB_ICON_SIZE, height: TAB_ICON_SIZE }}
      />
      <span className="text-[10.5px] font-semibold">{tab.label}</span>
    </button>
  );
}
