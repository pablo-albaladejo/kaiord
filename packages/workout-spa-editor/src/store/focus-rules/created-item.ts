/**
 * Rule: focus the item that was just created.
 *
 * Trivial wrapper around `focusItem(id)`, kept as its own file so the
 * surface of rules is uniform (one function per file) and so consumers
 * read intent at the call site: `setPendingFocusTarget(createdItemTarget(id))`.
 *
 * Purity: no React, no DOM, no store reads. See CI invariant.
 */

import type { FocusTarget } from "../focus/focus-target.types";
import { focusItem } from "../focus/focus-target.types";
import type { ItemId } from "../providers/item-id";

export const createdItemTarget = (newItemId: ItemId): FocusTarget =>
  focusItem(newItemId);
