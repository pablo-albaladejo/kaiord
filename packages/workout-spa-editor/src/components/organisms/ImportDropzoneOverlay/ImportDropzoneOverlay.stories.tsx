import type { Meta, StoryObj } from "@storybook/react";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import { useWorkoutStore } from "../../../store/workout-store";
import { ToastProvider } from "../../atoms/Toast";
import { ImportDropzoneOverlay } from "./ImportDropzoneOverlay";

/**
 * `ImportDropzoneOverlay` takes no props at all — in the real app it is
 * "opened" by `EditorPage` only mounting it when the URL carries
 * `?action=import`; here the equivalent is the `route` parameter each
 * story sets below, which also drives the `?date=` / `?from=` behavior
 * `useImportOnLoad` reads via `useSearch()`.
 *
 * It also reads `usePersistence()` unconditionally on every render and writes
 * to the `useWorkoutStore` zustand singleton on mount (`clearWorkout`). The
 * global stack supplies a persistence port, but it is the real Dexie one; this
 * story wraps its own so an import cannot write to the browser's database,
 * matching `ImportDropzoneOverlay.test.tsx`'s render harness.
 */
const meta = {
  title: "Organisms/ImportDropzoneOverlay",
  component: ImportDropzoneOverlay,
  parameters: {
    layout: "fullscreen",
    route: "/workout/new?action=import",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      // Module-singleton store: reset it so a value left behind by another
      // story doesn't flash before the component's own on-mount clear runs.
      useWorkoutStore.setState({
        currentWorkout: null,
        undoHistory: [],
        historyIndex: -1,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
      });
      return (
        <PersistenceProvider persistence={createDexiePersistence(db)}>
          <ToastProvider>
            <ToastContextProvider>
              <Story />
            </ToastContextProvider>
          </ToastProvider>
        </PersistenceProvider>
      );
    },
  ],
} satisfies Meta<typeof ImportDropzoneOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Header "Import" entry — no `?date=`. A successful upload loads the
 * parsed workout into the editor store without persisting it.
 */
export const HeaderEntryImport: Story = {};

/**
 * Opened from a calendar day — `?date=` is present, so a successful
 * upload persists the parsed workout as a `WorkoutRecord` tagged to that
 * day and navigates to `/workout/:id` instead of only loading it into
 * the in-memory store. The dropzone itself renders identically; the
 * difference is in what happens after a file is dropped.
 */
export const DateTaggedImport: Story = {
  parameters: {
    route: "/workout/new?action=import&date=2026-03-15",
  },
};
