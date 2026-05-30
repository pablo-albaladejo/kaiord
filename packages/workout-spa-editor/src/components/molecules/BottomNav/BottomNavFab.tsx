import { Icon, ICON_MAP } from "../../atoms/Icon";
import { FAB_ICON_SIZE, FAB_STYLE } from "./bottom-nav-styles";

type BottomNavFabProps = {
  onActivate: () => void;
};

/**
 * Raised gradient action button centered over the bar notch.
 */
export function BottomNavFab({ onActivate }: BottomNavFabProps) {
  return (
    <button
      type="button"
      aria-label="Create workout"
      onClick={onActivate}
      style={FAB_STYLE}
      className="absolute -top-[18px] left-1/2 flex -translate-x-1/2 items-center justify-center rounded-[20px] text-white"
    >
      <Icon
        icon={ICON_MAP.plus}
        color="inherit"
        strokeWidth={2.2}
        style={{ width: FAB_ICON_SIZE, height: FAB_ICON_SIZE }}
      />
    </button>
  );
}
