import { CheckSquare, Group, Ungroup } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
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

export const StructuralActions = (p: Props) => {
  const t = useTranslate("editor");
  return (
    <>
      {p.showSelectAll && (
        <EditorMenuItem
          onSelect={p.onSelectAll}
          aria={`${ariaModifier}+A`}
          icon={CheckSquare}
          label={t("contextMenu.selectAll")}
          hint={`${modifierSymbol}A`}
        />
      )}
      {p.showGroup && (
        <EditorMenuItem
          onSelect={p.onGroup}
          aria={`${ariaModifier}+G`}
          icon={Group}
          label={t("contextMenu.group")}
          hint={`${modifierSymbol}G`}
        />
      )}
      {p.showUngroup && (
        <EditorMenuItem
          onSelect={p.onUngroup}
          aria={`Shift+${ariaModifier}+G`}
          icon={Ungroup}
          label={t("contextMenu.ungroup")}
          hint={`${shiftSymbol}${modifierSymbol}G`}
        />
      )}
    </>
  );
};
