import { useMemo } from "react";
import type { ReactNode } from "react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { PersistenceProvider } from "@ds-stories/packages/workout-spa-editor/src/contexts/persistence-context";
import { createInMemoryPersistence } from "@ds-stories/packages/workout-spa-editor/src/test-utils/in-memory-persistence";
import { useWorkoutStore } from "@ds-stories/packages/workout-spa-editor/src/store/workout-store";
import { ImportDropzoneOverlay } from "@ds-stories/packages/workout-spa-editor/src/components/organisms/ImportDropzoneOverlay/ImportDropzoneOverlay";

/**
 * `ImportDropzoneOverlay` takes no props at all — in the real app it is
 * "opened" by `EditorPage` only mounting it when the URL carries
 * `?action=import`, and it reads `?date=`/`?from=` via wouter's
 * `useSearch()`. The card harness ignores the story's `parameters.route`
 * (that is a `.storybook/preview.tsx` decorator), so each export below
 * nests its own `wouter` `Router` at the route it needs — the same
 * `memoryLocation` technique `DesignSystemProviders` itself uses.
 *
 * It also reads `usePersistence()` unconditionally (via `useImportOnLoad`)
 * and writes to the `useWorkoutStore` zustand singleton on mount
 * (`clearWorkout`). `DesignSystemProviders` deliberately does not supply a
 * `PersistenceProvider` — the real Dexie port is out of bounds for the card
 * harness — so this preview wraps an in-memory one locally, and resets the
 * store the same way the story's own decorator does, so a value left behind
 * by another card does not flash before the component's own on-mount clear
 * runs.
 */
function AtRoute({ path, children }: { path: string; children: ReactNode }) {
  const { hook } = useMemo(() => memoryLocation({ path }), [path]);
  return <Router hook={hook}>{children}</Router>;
}

function Scenario({ path }: { path: string }) {
  useWorkoutStore.setState({
    currentWorkout: null,
    undoHistory: [],
    historyIndex: -1,
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
  });
  return (
    <AtRoute path={path}>
      <PersistenceProvider persistence={createInMemoryPersistence()}>
        <ImportDropzoneOverlay />
      </PersistenceProvider>
    </AtRoute>
  );
}

/**
 * Header "Import" entry — no `?date=`. A successful upload loads the
 * parsed workout into the editor store without persisting it.
 */
export const HeaderEntryImport = () => (
  <Scenario path="/workout/new?action=import" />
);

/**
 * Opened from a calendar day — `?date=` is present, so a successful
 * upload would persist the parsed workout tagged to that day instead of
 * only loading it into the in-memory store. The dropzone itself renders
 * identically; the difference is in what happens after a file is dropped.
 */
export const DateTaggedImport = () => (
  <Scenario path="/workout/new?action=import&date=2026-03-15" />
);
