/**
 * Library Store Tests
 *
 * Tests for the library store implementation.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { KRD } from "../types/krd";
import { useLibraryStore } from "./library-store";

describe("useLibraryStore", () => {
  const mockKRD: KRD = {
    version: "1.0",
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "cycling",
    },
    extensions: {
      structured_workout: {
        name: "Test Workout",
        sport: "cycling",
        steps: [],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useLibraryStore.setState({
      templates: [],
    });
  });

  describe("initial state", () => {
    it("should have empty templates array initially", () => {
      const state = useLibraryStore.getState();

      expect(state.templates).toEqual([]);
    });
  });

  describe("addTemplate", () => {
    it("should add a template with name, sport, and KRD", () => {
      const template = useLibraryStore
        .getState()
        .addTemplate("Morning Ride", "cycling", mockKRD);
      const state = useLibraryStore.getState();

      expect(state.templates).toHaveLength(1);
      expect(template.name).toBe("Morning Ride");
      expect(template.sport).toBe("cycling");
      expect(template.krd).toEqual(mockKRD);
      expect(template.id).toBeDefined();
      expect(template.tags).toEqual([]);
      expect(template.createdAt).toBeDefined();
      expect(template.updatedAt).toBeDefined();
    });

    it("should add a template with all options", () => {
      const template = useLibraryStore
        .getState()
        .addTemplate("Interval Training", "running", mockKRD, {
          tags: ["intervals", "hard"],
          difficulty: "hard",
          duration: 3600,
          notes: "High intensity workout",
          thumbnailData: "data:image/png;base64,abc123",
        });

      expect(template.tags).toEqual(["intervals", "hard"]);
      expect(template.difficulty).toBe("hard");
      expect(template.duration).toBe(3600);
      expect(template.notes).toBe("High intensity workout");
      expect(template.thumbnailData).toBe("data:image/png;base64,abc123");
    });

    it("should generate unique IDs for each template", () => {
      const t1 = useLibraryStore
        .getState()
        .addTemplate("W1", "cycling", mockKRD);
      const t2 = useLibraryStore
        .getState()
        .addTemplate("W2", "running", mockKRD);

      expect(t1.id).not.toBe(t2.id);
    });
  });

  describe("updateTemplate", () => {
    it("should update template name", () => {
      const template = useLibraryStore
        .getState()
        .addTemplate("Old", "cycling", mockKRD);

      useLibraryStore.getState().updateTemplate(template.id, { name: "New" });
      const state = useLibraryStore.getState();

      expect(state.templates[0].name).toBe("New");
    });

    it("should do nothing when template ID does not exist", () => {
      useLibraryStore.getState().addTemplate("W", "cycling", mockKRD);

      useLibraryStore
        .getState()
        .updateTemplate("non-existent", { name: "New" });

      expect(useLibraryStore.getState().templates).toHaveLength(1);
    });

    it("strips UI ids from the updated krd payload (stripIds chokepoint)", () => {
      const template = useLibraryStore
        .getState()
        .addTemplate("W", "cycling", mockKRD);

      const krdWithIds: KRD = {
        ...mockKRD,
        extensions: {
          structured_workout: {
            name: "updated",
            sport: "cycling",
            steps: [
              {
                id: "leaked-id",
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 60 },
                targetType: "open",
                target: { type: "open" },
              },
            ],
          },
        },
      };

      useLibraryStore
        .getState()
        .updateTemplate(template.id, { krd: krdWithIds });

      const persistedStep = (
        useLibraryStore.getState().templates[0].krd.extensions
          ?.structured_workout as { steps: Array<Record<string, unknown>> }
      ).steps[0];
      // Own-property absence: asserts the key is removed, not just
      // left as `{ id: undefined }`.
      expect(Object.prototype.hasOwnProperty.call(persistedStep, "id")).toBe(
        false
      );
      expect(persistedStep).toStrictEqual({
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 60 },
        targetType: "open",
        target: { type: "open" },
      });
    });
  });

  describe("deleteTemplate", () => {
    it("should remove template from store", () => {
      const template = useLibraryStore
        .getState()
        .addTemplate("Del", "cycling", mockKRD);

      useLibraryStore.getState().deleteTemplate(template.id);

      expect(useLibraryStore.getState().templates).toHaveLength(0);
    });

    it("should remove correct template when multiple exist", () => {
      const t1 = useLibraryStore
        .getState()
        .addTemplate("W1", "cycling", mockKRD);
      const t2 = useLibraryStore
        .getState()
        .addTemplate("W2", "running", mockKRD);

      useLibraryStore.getState().deleteTemplate(t1.id);
      const state = useLibraryStore.getState();

      expect(state.templates).toHaveLength(1);
      expect(state.templates[0].id).toBe(t2.id);
    });
  });

  describe("getTemplate", () => {
    it("should return template by ID", () => {
      const template = useLibraryStore
        .getState()
        .addTemplate("Test", "cycling", mockKRD);

      const found = useLibraryStore.getState().getTemplate(template.id);

      expect(found).toEqual(template);
    });

    it("should return null when template ID does not exist", () => {
      useLibraryStore.getState().addTemplate("W", "cycling", mockKRD);

      const found = useLibraryStore.getState().getTemplate("non-existent");

      expect(found).toBeNull();
    });
  });

  describe("searchTemplates", () => {
    it("should filter templates by name (case insensitive)", () => {
      useLibraryStore
        .getState()
        .addTemplate("Morning Ride", "cycling", mockKRD);
      useLibraryStore.getState().addTemplate("Evening Run", "running", mockKRD);

      const results = useLibraryStore.getState().searchTemplates("morning");

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Morning Ride");
    });
  });

  describe("filterByTags", () => {
    it("should return all templates when tags array is empty", () => {
      useLibraryStore
        .getState()
        .addTemplate("W1", "cycling", mockKRD, { tags: ["easy"] });
      useLibraryStore
        .getState()
        .addTemplate("W2", "running", mockKRD, { tags: ["hard"] });

      const results = useLibraryStore.getState().filterByTags([]);

      expect(results).toHaveLength(2);
    });
  });

  describe("filterBySport", () => {
    it("should filter templates by sport", () => {
      useLibraryStore.getState().addTemplate("Ride", "cycling", mockKRD);
      useLibraryStore.getState().addTemplate("Run", "running", mockKRD);

      const results = useLibraryStore.getState().filterBySport("cycling");

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Ride");
    });
  });

  describe("getAllTags", () => {
    it("should return all unique tags sorted alphabetically", () => {
      useLibraryStore.getState().addTemplate("W1", "cycling", mockKRD, {
        tags: ["easy", "endurance"],
      });
      useLibraryStore.getState().addTemplate("W2", "running", mockKRD, {
        tags: ["hard", "easy"],
      });

      const tags = useLibraryStore.getState().getAllTags();

      expect(tags).toEqual(["easy", "endurance", "hard"]);
    });
  });
});
