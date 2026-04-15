import * as ContextMenu from "@radix-ui/react-context-menu";
import { ClipboardCopy, ClipboardPaste, Scissors, Trash } from "lucide-react";

import {
  ariaModifier,
  deleteSymbol,
  modifierSymbol,
} from "../../../utils/platform";
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

export const EditActions = (p: Props) => (
  <>
    {p.showCut && (
      <EditorMenuItem
        onSelect={p.onCut}
        aria={`${ariaModifier}+X`}
        icon={Scissors}
        label="Cut"
        hint={`${modifierSymbol}X`}
      />
    )}
    {p.showCopy && (
      <EditorMenuItem
        onSelect={p.onCopy}
        aria={`${ariaModifier}+C`}
        icon={ClipboardCopy}
        label="Copy"
        hint={`${modifierSymbol}C`}
      />
    )}
    {p.showPaste && (
      <EditorMenuItem
        onSelect={p.onPaste}
        aria={`${ariaModifier}+V`}
        icon={ClipboardPaste}
        label="Paste"
        hint={`${modifierSymbol}V`}
      />
    )}
    {p.showDelete && (
      <ContextMenu.Item
        className={deleteItemClass}
        onSelect={p.onDelete}
        aria-keyshortcuts="Delete"
      >
        <Trash className="h-4 w-4" />
        <span>Delete</span>
        <span className={shortcutClass}>{deleteSymbol}</span>
      </ContextMenu.Item>
    )}
  </>
);
