/**
 * Library Store Tests
 *
 * Tests for the Zustand library store implementation.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KRD } from "../types/krd";
import * as libraryStorage from "../utils/library-storage";
import { useLibraryStore } from "./library-store";

describe("useLibraryStore", () => {
  // Mock KRD data
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

  // Reset store and localStorage before each test
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useLibraryStore.setState({
      templates: [],
    });
  });

  describe("initial state", () => {
    it("should have empty templates array initially", () => {
      // Arrange & Act
      const state = useLibraryStore.getState();

      // Assert
      expect(state.templates).toEqual([]);
    });
  });

  describe("addTemplate", () => {
    it("should add a template with name, sport, and KRD", () => {
      // Arrange
      const name = "Morning Ride";
      const sport = "cycling";

      // Act
      const template = useLibraryStore
        .getState()
        .addTemplate(name, sport, mockKRD);
      const state = useLibraryStore.getState();

      // Assert
      expect(state.templates).toHaveLength(1);
      expect(template.name).toBe(name);
      expect(template.sport).toBe(sport);
      expect(template.krd).toEqual(mockKRD);
      expect(template.id).toBeDefined();
      expect(template.tags).toEqual([]);
      expect(template.difficulty).toBeUndefined();
      expect(template.duration).toBeUndefined();
      expect(template.notes).toBeUndefined();
      expect(template.thumbnailData).toBeUndefined();
      expect(template.createdAt).toBeDefined();
      expect(template.updatedAt).toBeDefined();
    });

    it("should add a template with all options", () => {
      // Arrange
      const name = "Interval Training";
      const sport = "running";
      const options = {
        tags: ["intervals", "hard"],
        difficulty: "hard" as const,
        duration: 3600,
        notes: "High intensity workout",
        thumbnailData: "data:image/png;base64,abc123",
      };

      // Act
      const template = useLibraryStore
        .getState()
        .addTemplate(name, sport, mockKRD, options);

      // Assert
      expect(template.name).toBe(name);
      expect(template.sport).toBe(sport);
      expect(template.tags).toEqual(["intervals", "hard"]);
      expect(template.difficulty).toBe("hard");
      expect(template.duration).toBe(3600);
      expect(template.notes).toBe("High intensity workout");
      expect(template.thumbnailData).toBe("data:image/png;base64,abc123");
    });

    it("should generate unique IDs for each template", () => {
      // Arrange & Act
      const template1 = useLibraryStore
        .getState()
        .addTemplate("Workout 1", "cycling", mockKRD);
      const template2 = useLibraryStore
        .getState()
        .addTemplate("Workout 2", "running", mockKRD);

      // Assert
      expect(template1.id).not.toBe(template2.id);
    });

    it("should set createdAt and updatedAt timestamps", () => {
      // Arrange
      const beforeTime = new Date().toISOString();

      // Act
      const template = useLibraryStore
        .getState()
        .addTemplate("Test", "cycling", mockKRD);
      const afterTime = new Date().toISOString();

      // Assert
      expect(template.createdAt >= beforeTime).toBe(true);
      expect(template.createdAt <= afterTime).toBe(true);
      expect(template.updatedAt).toBe(template.createdAt);
    });
  });

  describe("updateTemplate", () => {
    it("should update template name", () => {
      // Arrange
      const template = useLibraryStore
        .getState()
        .addTemplate("Old Name", "cycling", mockKRD);
      const newName = "New Name";
      const originalUpdatedAt = template.updatedAt;

      // Act
      useLibraryStore.getState().updateTemplate(template.id, { name: newName });
      const state = useLibraryStore.getState();

      // Assert
      const updatedTemplate = state.templates[0];
      expect(updatedTemplate.name).toBe(newName);
      expect(updatedTemplate.updatedAt >= originalUpdatedAt).toBe(true);
    });

    it("should update tags", () => {
      // Arrange
      const template = useLibraryStore
        .getState()
        .addTemplate("Workout", "cycling", mockKRD, { tags: ["easy"] });

      // Act
      useLibraryStore
        .getState()
        .updateTemplate(template.id, { tags: ["hard", "intervals"] });
      const state = useLibraryStore.getState();

      // Assert
      expect(state.templates[0].tags).toEqual(["hard", "intervals"]);
    });

    it("should update difficulty", () => {
      // Arrange
      const template = useLibraryStore
        .getState()
        .addTemplate("Workout", "cycling", mockKRD);

      // Act
      useLibraryStore
        .getState()
        .updateTemplate(template.id, { difficulty: "very_hard" });
      const state = useLibraryStore.getState();

      // Assert
      expect(state.templates[0].difficulty).toBe("very_hard");
    });

    it("should update duration", () => {
      // Arrange
      const template = useLibraryStore
        .getState()
        .addTemplate("Workout", "cycling", mockKRD);

      // Act
      useLibraryStore
        .getState()
        .updateTemplate(template.id, { duration: 7200 });
      const state = useLibraryStore.getState();

      // Assert
      expect(state.templates[0].duration).toBe(7200);
    });

    it("should update notes", () => {
      // Arrange
      const template = useLibraryStore
        .getState()
        .addTemplate("Workout", "cycling", mockKRD);

      // Act
      useLibraryStore
        .getState()
        .updateTemplate(template.id, { notes: "Updated notes" });
      const state = useLibraryStore.getState();

      // Assert
      expect(state.templates[0].notes).toBe("Updated notes");
    });

    it("should update thumbnailData", () => {
      // Arrange
      const template = useLibraryStore
        .getState()
        .addTemplate("Workout", "cycling", mockKRD);

      // Act
      useLibraryStore.getState().updateTemplate(template.id, {
        thumbnailData: "data:image/png;base64,xyz",
      });
      const state = useLibraryStore.getState();

      // Assert
      expect(state.templates[0].thumbnailData).toBe(
        "data:image/png;base64,xyz"
      );
    });

    it("should do nothing when template ID does not exist", () => {
      // Arrange
      const template = useLibraryStore
        .getState()
        .addTemplate("Workout", "cycling", mockKRD);
      const nonExistentId = "non-existent-id";

      // Act
      useLibraryStore.getState().updateTemplate(nonExistentId, { name: "New" });
      const state = useLibraryStore.getState();

      // Assert
      expect(state.templates).toHaveLength(1);
      expect(state.templates[0].name).toBe(template.name);
    });

    it("should update multiple fields at once", () => {
      // Arrange
      const template = useLibraryStore
        .getState()
        .addTemplate("Workout", "cycling", mockKRD);

      // Act
      useLibraryStore.getState().updateTemplate(template.id, {
        name: "Updated Workout",
        tags: ["new", "tags"],
        difficulty: "moderate",
        duration: 5400,
        notes: "New notes",
      });
      const state = useLibraryStore.getState();

      // Assert
      const updated = state.templates[0];
      expect(updated.name).toBe("Updated Workout");
      expect(updated.tags).toEqual(["new", "tags"]);
      expect(updated.difficulty).toBe("moderate");
      expect(updated.duration).toBe(5400);
      expect(updated.notes).toBe("New notes");
    });
  });

  describe("deleteTemplate", () => {
    it("should remove template from store", () => {
      // Arrange
      const template = useLibraryStore
        .getState()
        .addTemplate("To Delete", "cycling", mockKRD);

      // Act
      useLibraryStore.getState().deleteTemplate(template.id);
      const state = useLibraryStore.getState();

      // Assert
      expect(state.templates).toHaveLength(0);
    });

    it("should remove correct template when multiple exist", () => {
      // Arrange
      const template1 = useLibraryStore
        .getState()
        .addTemplate("Workout 1", "cycling", mockKRD);
      const template2 = useLibraryStore
        .getState()
        .addTemplate("Workout 2", "running", mockKRD);

      // Act
      useLibraryStore.getState().deleteTemplate(template1.id);
      const state = useLibraryStore.getState();

      // Assert
      expect(state.templates).toHaveLength(1);
      expect(state.templates[0].id).toBe(template2.id);
    });

    it("should do nothing when template ID does not exist", () => {
      // Arrange
      useLibraryStore.getState().addTemplate("Workout", "cycling", mockKRD);
      const nonExistentId = "non-existent-id";

      // Act
      useLibraryStore.getState().deleteTemplate(nonExistentId);
      const state = useLibraryStore.getState();

      // Assert
      expect(state.templates).toHaveLength(1);
    });
  });

  describe("getTemplate", () => {
    it("should return template by ID", () => {
      // Arrange
      const template = useLibraryStore
        .getState()
        .addTemplate("Test", "cycling", mockKRD);

      // Act
      const foundTemplate = useLibraryStore.getState().getTemplate(template.id);

      // Assert
      expect(foundTemplate).toEqual(template);
    });

    it("should return null when template ID does not exist", () => {
      // Arrange
      useLibraryStore.getState().addTemplate("Workout", "cycling", mockKRD);

      // Act
      const foundTemplate = useLibraryStore
        .getState()
        .getTemplate("non-existent-id");

      // Assert
      expect(foundTemplate).toBeNull();
    });

    it("should return correct template when multiple templates exist", () => {
      // Arrange
      const template1 = useLibraryStore
        .getState()
        .addTemplate("Workout 1", "cycling", mockKRD);
      const template2 = useLibraryStore
        .getState()
        .addTemplate("Workout 2", "running", mockKRD);

      // Act
      const foundTemplate = useLibraryStore
        .getState()
        .getTemplate(template2.id);

      // Assert
      expect(foundTemplate).toEqual(template2);
      expect(foundTemplate?.id).not.toBe(template1.id);
    });
  });

  describe("searchTemplates", () => {
    it("should return all templates when query is empty", () => {
      // Arrange
      useLibraryStore
        .getState()
        .addTemplate("Morning Ride", "cycling", mockKRD);
      useLibraryStore.getState().addTemplate("Evening Run", "running", mockKRD);

      // Act
      const results = useLibraryStore.getState().searchTemplates("");

      // Assert
      expect(results).toHaveLength(2);
    });

    it("should filter templates by name (case insensitive)", () => {
      // Arrange
      useLibraryStore
        .getState()
        .addTemplate("Morning Ride", "cycling", mockKRD);
      useLibraryStore.getState().addTemplate("Evening Run", "running", mockKRD);
      useLibraryStore
        .getState()
        .addTemplate("Morning Swim", "swimming", mockKRD);

      // Act
      const results = useLibraryStore.getState().searchTemplates("morning");

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe("Morning Ride");
      expect(results[1].name).toBe("Morning Swim");
    });

    it("should return empty array when no matches found", () => {
      // Arrange
      useLibraryStore
        .getState()
        .addTemplate("Morning Ride", "cycling", mockKRD);

      // Act
      const results = useLibraryStore.getState().searchTemplates("evening");

      // Assert
      expect(results).toHaveLength(0);
    });

    it("should match partial names", () => {
      // Arrange
      useLibraryStore
        .getState()
        .addTemplate("Interval Training", "cycling", mockKRD);

      // Act
      const results = useLibraryStore.getState().searchTemplates("inter");

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Interval Training");
    });
  });

  describe("filterByTags", () => {
    it("should return all templates when tags array is empty", () => {
      // Arrange
      useLibraryStore
        .getState()
        .addTemplate("Workout 1", "cycling", mockKRD, { tags: ["easy"] });
      useLibraryStore
        .getState()
        .addTemplate("Workout 2", "running", mockKRD, { tags: ["hard"] });

      // Act
      const results = useLibraryStore.getState().filterByTags([]);

      // Assert
      expect(results).toHaveLength(2);
    });

    it("should filter templates by single tag", () => {
      // Arrange
      useLibraryStore.getState().addTemplate("Workout 1", "cycling", mockKRD, {
        tags: ["easy", "endurance"],
      });
      useLibraryStore.getState().addTemplate("Workout 2", "running", mockKRD, {
        tags: ["hard", "intervals"],
      });
      useLibraryStore.getState().addTemplate("Workout 3", "swimming", mockKRD, {
        tags: ["easy", "recovery"],
      });

      // Act
      const results = useLibraryStore.getState().filterByTags(["easy"]);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe("Workout 1");
      expect(results[1].name).toBe("Workout 3");
    });

    it("should filter templates by multiple tags (AND logic)", () => {
      // Arrange
      useLibraryStore.getState().addTemplate("Workout 1", "cycling", mockKRD, {
        tags: ["easy", "endurance"],
      });
      useLibraryStore.getState().addTemplate("Workout 2", "running", mockKRD, {
        tags: ["hard", "intervals"],
      });
      useLibraryStore.getState().addTemplate("Workout 3", "swimming", mockKRD, {
        tags: ["easy", "recovery"],
      });

      // Act
      const results = useLibraryStore
        .getState()
        .filterByTags(["easy", "endurance"]);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Workout 1");
    });

    it("should return empty array when no templates match all tags", () => {
      // Arrange
      useLibraryStore
        .getState()
        .addTemplate("Workout 1", "cycling", mockKRD, { tags: ["easy"] });

      // Act
      const results = useLibraryStore.getState().filterByTags(["easy", "hard"]);

      // Assert
      expect(results).toHaveLength(0);
    });
  });

  describe("filterBySport", () => {
    it("should filter templates by sport", () => {
      // Arrange
      useLibraryStore.getState().addTemplate("Ride 1", "cycling", mockKRD);
      useLibraryStore.getState().addTemplate("Run 1", "running", mockKRD);
      useLibraryStore.getState().addTemplate("Ride 2", "cycling", mockKRD);

      // Act
      const results = useLibraryStore.getState().filterBySport("cycling");

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe("Ride 1");
      expect(results[1].name).toBe("Ride 2");
    });

    it("should return empty array when no templates match sport", () => {
      // Arrange
      useLibraryStore.getState().addTemplate("Ride", "cycling", mockKRD);

      // Act
      const results = useLibraryStore.getState().filterBySport("swimming");

      // Assert
      expect(results).toHaveLength(0);
    });
  });

  describe("getAllTags", () => {
    it("should return empty array when no templates exist", () => {
      // Arrange & Act
      const tags = useLibraryStore.getState().getAllTags();

      // Assert
      expect(tags).toEqual([]);
    });

    it("should return all unique tags sorted alphabetically", () => {
      // Arrange
      useLibraryStore.getState().addTemplate("Workout 1", "cycling", mockKRD, {
        tags: ["easy", "endurance"],
      });
      useLibraryStore.getState().addTemplate("Workout 2", "running", mockKRD, {
        tags: ["hard", "intervals"],
      });
      useLibraryStore.getState().addTemplate("Workout 3", "swimming", mockKRD, {
        tags: ["easy", "recovery"],
      });

      // Act
      const tags = useLibraryStore.getState().getAllTags();

      // Assert
      expect(tags).toEqual([
        "easy",
        "endurance",
        "hard",
        "intervals",
        "recovery",
      ]);
    });

    it("should not include duplicate tags", () => {
      // Arrange
      useLibraryStore.getState().addTemplate("Workout 1", "cycling", mockKRD, {
        tags: ["easy", "endurance"],
      });
      useLibraryStore.getState().addTemplate("Workout 2", "running", mockKRD, {
        tags: ["easy", "recovery"],
      });

      // Act
      const tags = useLibraryStore.getState().getAllTags();

      // Assert
      expect(tags).toEqual(["easy", "endurance", "recovery"]);
    });
  });

  describe("persistence", () => {
    it("should save library to localStorage when adding a template", () => {
      // Arrange
      const saveSpy = vi.spyOn(libraryStorage, "saveLibrary");

      // Act
      useLibraryStore.getState().addTemplate("Test", "cycling", mockKRD);

      // Assert
      expect(saveSpy).toHaveBeenCalled();
    });

    it("should save library to localStorage when updating a template", () => {
      // Arrange
      const template = useLibraryStore
        .getState()
        .addTemplate("Test", "cycling", mockKRD);
      const saveSpy = vi.spyOn(libraryStorage, "saveLibrary");

      // Act
      useLibraryStore
        .getState()
        .updateTemplate(template.id, { name: "Updated" });

      // Assert
      expect(saveSpy).toHaveBeenCalled();
    });

    it("should save library to localStorage when deleting a template", () => {
      // Arrange
      const template = useLibraryStore
        .getState()
        .addTemplate("Test", "cycling", mockKRD);
      const saveSpy = vi.spyOn(libraryStorage, "saveLibrary");

      // Act
      useLibraryStore.getState().deleteTemplate(template.id);

      // Assert
      expect(saveSpy).toHaveBeenCalled();
    });

    it("should handle storage quota errors gracefully", () => {
      // Arrange
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.spyOn(libraryStorage, "saveLibrary").mockReturnValue({
        type: "quota_exceeded",
        message: "Storage quota exceeded",
      });

      // Act
      useLibraryStore.getState().addTemplate("Test", "cycling", mockKRD);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to save library:",
        "Storage quota exceeded"
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
