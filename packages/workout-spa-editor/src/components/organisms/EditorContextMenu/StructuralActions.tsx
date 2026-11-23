import { CheckSquare, Group, Ungroup } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import {
  ariaModifier,
  modifierSymbol,
  shiftSymbol,
} from "../../../utils/platform";
import { shortcutKey } from "../../../utils/shortcut-key";
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
          aria={`${ariaModifier}+${shortcutKey("select-all")}`}
          icon={CheckSquare}
          label={t("contextMenu.selectAll")}
          hint={`${modifierSymbol}${shortcutKey("select-all")}`}
        />
      )}
      {p.showGroup && (
        <EditorMenuItem
          onSelect={p.onGroup}
          aria={`${ariaModifier}+${shortcutKey("create-block")}`}
          icon={Group}
          label={t("contextMenu.group")}
          hint={`${modifierSymbol}${shortcutKey("create-block")}`}
        />
      )}
      {p.showUngroup && (
        <EditorMenuItem
          onSelect={p.onUngroup}
          aria={`Shift+${ariaModifier}+${shortcutKey("ungroup-block")}`}
          icon={Ungroup}
          label={t("contextMenu.ungroup")}
          hint={`${shiftSymbol}${modifierSymbol}${shortcutKey("ungroup-block")}`}
        />
      )}
    </>
  );
};
