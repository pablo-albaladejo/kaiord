/**
 * Library Store Actions
 */

import {
  createNewTemplate,
  extractAllTags,
  filterTemplatesBySport,
  filterTemplatesByTags,
  searchInTemplates,
  updateTemplateData,
} from "./helpers";
import { persistState } from "./persistence";
import type { LibraryStore } from "./types";
import type { StateCreator } from "zustand";

export const createActions: StateCreator<LibraryStore> = (set, get) => ({
  templates: [],

  addTemplate: (name, sport, krd, options = {}) => {
    const newTemplate = createNewTemplate(name, sport, krd, options);

    set((state) => {
      const newTemplates = [...state.templates, newTemplate];
      persistState(newTemplates);
      return { templates: newTemplates };
    });

    return newTemplate;
  },

  updateTemplate: (templateId, updates) => {
    set((state) => {
      const templateIndex = state.templates.findIndex(
        (t) => t.id === templateId
      );
      if (templateIndex === -1) return state;

      const template = state.templates[templateIndex];
      const updatedTemplate = updateTemplateData(template, updates);

      const newTemplates = [...state.templates];
      newTemplates[templateIndex] = updatedTemplate;

      persistState(newTemplates);
      return { templates: newTemplates };
    });
  },

  deleteTemplate: (templateId) => {
    set((state) => {
      const newTemplates = state.templates.filter((t) => t.id !== templateId);
      persistState(newTemplates);
      return { templates: newTemplates };
    });
  },

  getTemplate: (templateId) => {
    const state = get();
    return state.templates.find((t) => t.id === templateId) ?? null;
  },

  searchTemplates: (query) => {
    return searchInTemplates(get().templates, query);
  },

  filterByTags: (tags) => {
    return filterTemplatesByTags(get().templates, tags);
  },

  filterBySport: (sport) => {
    return filterTemplatesBySport(get().templates, sport);
  },

  getAllTags: () => {
    return extractAllTags(get().templates);
  },
});
