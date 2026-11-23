import { SHORTCUT_CATALOG } from "../constants/shortcut-catalog";

/**
 * The letter a catalog shortcut ends with ("X" for cut), so a surface that
 * shows a binding next to its action (the editor's context menu) reads it
 * from the same catalog as the shortcut sheet instead of typing it again.
 */
export const shortcutKey = (id: string): string => {
  const row = SHORTCUT_CATALOG.find((def) => def.id === id);
  const key = row?.keys[row.keys.length - 1];
  if (key === undefined) throw new Error(`No shortcut "${id}" in the catalog`);
  return key;
};
