import type { Announcements } from "@dnd-kit/core";

/**
 * Accessibility announcements for drag-and-drop operations
 * Provides screen reader feedback during drag interactions
 * Requirement 3: Visual feedback and accessibility for step reordering
 */
export const dndAnnouncements: Announcements = {
  onDragStart({ active }) {
    return `Picked up draggable item ${active.id}. Press arrow keys to move, space to drop.`;
  },
  onDragOver({ active, over }) {
    if (over) {
      return `Draggable item ${active.id} was moved over droppable area ${over.id}.`;
    }
    return `Draggable item ${active.id} is no longer over a droppable area.`;
  },
  onDragEnd({ active, over }) {
    if (over) {
      return `Draggable item ${active.id} was dropped over droppable area ${over.id}.`;
    }
    return `Draggable item ${active.id} was dropped.`;
  },
  onDragCancel({ active }) {
    return `Dragging was cancelled. Draggable item ${active.id} was dropped.`;
  },
};
