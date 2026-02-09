/**
 * Library Store
 *
 * Zustand store for managing workout library.
 * Automatically persists to localStorage on changes.
 */

import { create } from "zustand";
import { createActions } from "./library-store/actions";
import { loadInitialState } from "./library-store/initial-state";
import type { LibraryStore } from "./library-store/types";

export type { LibraryStore } from "./library-store/types";

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  ...createActions(set, get, {} as never),
  ...loadInitialState(),
}));
