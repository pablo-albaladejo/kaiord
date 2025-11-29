/**
 * Library Store
 *
 * Zustand store for managing workout library.
 * Automatically persists to localStorage on changes.
 */

import { create } from "zustand";
import type { KRD } from "../types/krd";
import type {
  DifficultyLevel,
  WorkoutTemplate,
} from "../types/workout-library";
import { loadLibrary, saveLibrary } from "../utils/library-storage";

export type LibraryStore = {
  // State
  templates: Array<WorkoutTemplate>;

  // Actions
  addTemplate: (
    name: string,
    sport: string,
    krd: KRD,
    options?: {
      tags?: Array<string>;
      difficulty?: DifficultyLevel;
      duration?: number;
      notes?: string;
      thumbnailData?: string;
    }
  ) => WorkoutTemplate;
  updateTemplate: (
    templateId: string,
    updates: Partial<
      Pick<
        WorkoutTemplate,
        "name" | "tags" | "difficulty" | "duration" | "notes" | "thumbnailData"
      >
    >
  ) => void;
  deleteTemplate: (templateId: string) => void;
  getTemplate: (templateId: string) => WorkoutTemplate | null;
  searchTemplates: (query: string) => Array<WorkoutTemplate>;
  filterByTags: (tags: Array<string>) => Array<WorkoutTemplate>;
  filterBySport: (sport: string) => Array<WorkoutTemplate>;
  getAllTags: () => Array<string>;
};

// Load initial state from localStorage
const loadInitialState = (): Pick<LibraryStore, "templates"> => {
  const result = loadLibrary();
  if (result.success) {
    return {
      templates: result.data.templates,
    };
  }
  return {
    templates: [],
  };
};

// Helper to persist state to localStorage
const persistState = (templates: Array<WorkoutTemplate>): void => {
  const error = saveLibrary(templates);
  if (error) {
    console.error("Failed to save library:", error.message);
  }
};

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  // Initial state loaded from localStorage
  ...loadInitialState(),

  // Add a new workout template
  addTemplate: (name, sport, krd, options = {}) => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const newTemplate: WorkoutTemplate = {
      id,
      name,
      sport,
      krd,
      tags: options.tags ?? [],
      difficulty: options.difficulty,
      duration: options.duration,
      notes: options.notes,
      thumbnailData: options.thumbnailData,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const newTemplates = [...state.templates, newTemplate];
      persistState(newTemplates);
      return { templates: newTemplates };
    });

    return newTemplate;
  },

  // Update template metadata
  updateTemplate: (templateId, updates) => {
    set((state) => {
      const templateIndex = state.templates.findIndex(
        (t) => t.id === templateId
      );
      if (templateIndex === -1) return state;

      const template = state.templates[templateIndex];
      const now = new Date().toISOString();

      const updatedTemplate: WorkoutTemplate = {
        ...template,
        ...updates,
        updatedAt: now,
      };

      const newTemplates = [...state.templates];
      newTemplates[templateIndex] = updatedTemplate;

      persistState(newTemplates);
      return { templates: newTemplates };
    });
  },

  // Delete a template
  deleteTemplate: (templateId) => {
    set((state) => {
      const newTemplates = state.templates.filter((t) => t.id !== templateId);
      persistState(newTemplates);
      return { templates: newTemplates };
    });
  },

  // Get a template by ID
  getTemplate: (templateId) => {
    const state = get();
    return state.templates.find((t) => t.id === templateId) ?? null;
  },

  // Search templates by name
  searchTemplates: (query) => {
    const state = get();
    const lowerQuery = query.toLowerCase();
    return state.templates.filter((t) =>
      t.name.toLowerCase().includes(lowerQuery)
    );
  },

  // Filter templates by tags
  filterByTags: (tags) => {
    const state = get();
    if (tags.length === 0) return state.templates;

    return state.templates.filter((t) =>
      tags.every((tag) => t.tags.includes(tag))
    );
  },

  // Filter templates by sport
  filterBySport: (sport) => {
    const state = get();
    return state.templates.filter((t) => t.sport === sport);
  },

  // Get all unique tags
  getAllTags: () => {
    const state = get();
    const allTags = state.templates.flatMap((t) => t.tags);
    return Array.from(new Set(allTags)).sort();
  },
}));
