import { CheckSquare, Group, Ungroup } from "lucide-react";

import {
  ariaModifier,
  modifierSymbol,
  shiftSymbol,
} from "../../../utils/platform";
import type { ContextMenuContentProps } from "./context-menu-content.types";
import { EditorMenuItem } from "./EditorMenuItem";

type Props = Pick<
  ContextMenuContentProps,
  | "showSelectAll"
  | "showGroup"
  | "showUngroup"
  | "onSelectAll"
  | "onGroup"
  | "onUngroup"
>;

export const StructuralActions = (p: Props) => (
  <>
    {p.showSelectAll && (
      <EditorMenuItem
        onSelect={p.onSelectAll}
        aria={`${ariaModifier}+A`}
        icon={CheckSquare}
        label="Select All"
        hint={`${modifierSymbol}A`}
      />
    )}
    {p.showGroup && (
      <EditorMenuItem
        onSelect={p.onGroup}
        aria={`${ariaModifier}+G`}
        icon={Group}
        label="Group"
        hint={`${modifierSymbol}G`}
      />
    )}
    {p.showUngroup && (
      <EditorMenuItem
        onSelect={p.onUngroup}
        aria={`Shift+${ariaModifier}+G`}
        icon={Ungroup}
        label="Ungroup"
        hint={`${shiftSymbol}${modifierSymbol}G`}
      />
    )}
  </>
);
