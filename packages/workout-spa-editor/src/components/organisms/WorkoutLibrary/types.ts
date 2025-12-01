import type { useLibraryFilters } from "./hooks/useLibraryFilters";
import type { useWorkoutLoader } from "./hooks/useWorkoutLoader";

export type LibraryFilters = ReturnType<typeof useLibraryFilters>;
export type LibraryLoader = ReturnType<typeof useWorkoutLoader>;
