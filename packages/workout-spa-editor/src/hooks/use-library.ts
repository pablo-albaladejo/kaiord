/**
 * useLibrary Hook
 *
 * Convenience re-export of the library store.
 * Consumers should import from here; the backing store
 * will be swapped to a pure Dexie useLiveQuery in a future wave.
 */

import { useLibraryStore } from "../store/library-store";
import type { LibraryStore } from "../store/library-store/types";

export const useLibrary = (): LibraryStore => useLibraryStore();
