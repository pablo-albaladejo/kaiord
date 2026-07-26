import type { Announcements } from "@dnd-kit/core";

import { getTranslate, type Translate } from "../../../i18n/use-translate";

/**
 * Accessibility announcements for drag-and-drop operations
 * Provides screen reader feedback during drag interactions
 * Requirement 3: Visual feedback and accessibility for step reordering
 */
export const createDndAnnouncements = (
  t: Translate = getTranslate("workout-detail")
): Announcements => ({
  onDragStart({ active }) {
    return t("dnd.picked", { id: active.id });
  },
  onDragOver({ active, over }) {
    if (over) {
      return t("dnd.movedOver", { id: active.id, over: over.id });
    }
    return t("dnd.noLongerOver", { id: active.id });
  },
  onDragEnd({ active, over }) {
    if (over) {
      return t("dnd.dropped", { id: active.id, over: over.id });
    }
    return t("dnd.droppedNoTarget", { id: active.id });
  },
  onDragCancel({ active }) {
    return t("dnd.cancelled", { id: active.id });
  },
});
