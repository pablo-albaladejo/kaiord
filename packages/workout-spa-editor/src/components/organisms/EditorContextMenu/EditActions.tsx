import * as ContextMenu from "@radix-ui/react-context-menu";
import { ClipboardCopy, ClipboardPaste, Scissors, Trash } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import {
  ariaModifier,
  deleteSymbol,
  modifierSymbol,
} from "../../../utils/platform";
import { shortcutKey } from "../../../utils/shortcut-key";
import type { ContextMenuContentProps } from "./context-menu-content.types";
import { deleteItemClass, shortcutClass } from "./context-menu-styles";
import { EditorMenuItem } from "./EditorMenuItem";

type Props = Pick<
  ContextMenuContentProps,
  | "showCut"
  | "showCopy"
  | "showPaste"
  | "showDelete"
  | "onCut"
  | "onCopy"
  | "onPaste"
  | "onDelete"
>;

export const EditActions = (p: Props) => {
  const t = useTranslate("editor");
  return (
    <>
      {p.showCut && (
        <EditorMenuItem
          onSelect={p.onCut}
          aria={`${ariaModifier}+${shortcutKey("cut")}`}
          icon={Scissors}
          label={t("contextMenu.cut")}
          hint={`${modifierSymbol}${shortcutKey("cut")}`}
        />
      )}
      {p.showCopy && (
        <EditorMenuItem
          onSelect={p.onCopy}
          aria={`${ariaModifier}+${shortcutKey("copy")}`}
          icon={ClipboardCopy}
          label={t("contextMenu.copy")}
          hint={`${modifierSymbol}${shortcutKey("copy")}`}
        />
      )}
      {p.showPaste && (
        <EditorMenuItem
          onSelect={p.onPaste}
          aria={`${ariaModifier}+${shortcutKey("paste")}`}
          icon={ClipboardPaste}
          label={t("contextMenu.paste")}
          hint={`${modifierSymbol}${shortcutKey("paste")}`}
        />
      )}
      {p.showDelete && (
        <ContextMenu.Item
          className={deleteItemClass}
          onSelect={p.onDelete}
          aria-keyshortcuts="Delete"
        >
          <Trash className="h-4 w-4" />
          <span>{t("contextMenu.delete")}</span>
          <span className={shortcutClass}>{deleteSymbol}</span>
        </ContextMenu.Item>
      )}
    </>
  );
};
