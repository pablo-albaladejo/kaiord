/**
 * Modal Store Actions Tests
 *
 * Tests for modal state management in the workout store.
 * Requirements: 6.1
 */

import { beforeEach, describe, expect, it } from "vitest";

import { useWorkoutStore } from "./workout-store";

describe("Modal Store Actions", () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      isModalOpen: false,
      modalConfig: null,
    });
  });

  describe("showConfirmationModal", () => {
    it("should set isModalOpen to true and modalConfig with provided configuration", () => {
      // Arrange
      const config = {
        title: "Delete Block",
        message: "Are you sure you want to delete this repetition block?",
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        onConfirm: () => {},
        onCancel: () => {},
        variant: "destructive" as const,
      };

      // Act
      useWorkoutStore.getState().showConfirmationModal(config);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.isModalOpen).toBe(true);
      expect(state.modalConfig).toEqual(config);
    });
  });

  describe("hideConfirmationModal", () => {
    it("should set isModalOpen to false and clear modalConfig", () => {
      // Arrange
      useWorkoutStore.setState({
        isModalOpen: true,
        modalConfig: {
          title: "Test",
          message: "Test",
          confirmLabel: "OK",
          cancelLabel: "Cancel",
          onConfirm: () => {},
          onCancel: () => {},
          variant: "default",
        },
      });

      // Act
      useWorkoutStore.getState().hideConfirmationModal();
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.isModalOpen).toBe(false);
      expect(state.modalConfig).toBeNull();
    });

    it("should work when modal is already closed", () => {
      // Arrange
      useWorkoutStore.setState({
        isModalOpen: false,
        modalConfig: null,
      });
      useWorkoutStore.getState().hideConfirmationModal();

      // Act
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.isModalOpen).toBe(false);
      expect(state.modalConfig).toBeNull();
    });
  });

  describe("modal state transitions", () => {
    it("should transition from closed to open to closed", () => {
      // Arrange
      const config = {
        title: "Test",
        message: "Test message",
        confirmLabel: "OK",
        cancelLabel: "Cancel",
        onConfirm: () => {},
        onCancel: () => {},
        variant: "default" as const,
      };
      let state = useWorkoutStore.getState();
      expect(state.isModalOpen).toBe(false);
      expect(state.modalConfig).toBeNull();
      useWorkoutStore.getState().showConfirmationModal(config);
      state = useWorkoutStore.getState();
      expect(state.isModalOpen).toBe(true);
      expect(state.modalConfig).toEqual(config);
      useWorkoutStore.getState().hideConfirmationModal();

      // Act
      state = useWorkoutStore.getState();

      // Assert
      expect(state.isModalOpen).toBe(false);
      expect(state.modalConfig).toBeNull();
    });

    it("should allow opening a new modal while one is already open", () => {
      // Arrange
      const firstConfig = {
        title: "First Modal",
        message: "First message",
        confirmLabel: "OK",
        cancelLabel: "Cancel",
        onConfirm: () => {},
        onCancel: () => {},
        variant: "default" as const,
      };
      const secondConfig = {
        title: "Second Modal",
        message: "Second message",
        confirmLabel: "Confirm",
        cancelLabel: "Abort",
        onConfirm: () => {},
        onCancel: () => {},
        variant: "destructive" as const,
      };
      useWorkoutStore.getState().showConfirmationModal(firstConfig);
      useWorkoutStore.getState().showConfirmationModal(secondConfig);

      // Act
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.isModalOpen).toBe(true);
      expect(state.modalConfig?.title).toBe("Second Modal");
      expect(state.modalConfig?.variant).toBe("destructive");
    });
  });
});
