import * as ContextMenu from "@radix-ui/react-context-menu";
import type { LucideIcon } from "lucide-react";

import { menuItemClass, shortcutClass } from "./context-menu-styles";

type EditorMenuItemProps = {
  icon: LucideIcon;
  label: string;
  hint: string;
  aria: string;
  onSelect: () => void;
};

export const EditorMenuItem = ({
  icon: Icon,
  label,
  hint,
  aria,
  onSelect,
}: EditorMenuItemProps) => (
  <ContextMenu.Item
    className={menuItemClass}
    onSelect={onSelect}
    aria-keyshortcuts={aria}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
    <span className={shortcutClass}>{hint}</span>
  </ContextMenu.Item>
);
