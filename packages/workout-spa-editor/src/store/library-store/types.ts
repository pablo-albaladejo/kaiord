/**
 * Library Store Types
 */

import type { KRD } from "../../types/krd";
import type {
  DifficultyLevel,
  WorkoutTemplate,
} from "../../types/workout-library";

export type LibraryStore = {
  templates: Array<WorkoutTemplate>;
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
