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
    it("should set isModalOpen to true", () => {
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
    });

    it("should set modalConfig with provided configuration", () => {
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
      expect(state.modalConfig).toEqual(config);
    });

    it("should preserve all modal configuration properties", () => {
      // Arrange
      const onConfirm = () => console.log("confirmed");
      const onCancel = () => console.log("cancelled");
      const config = {
        title: "Test Title",
        message: "Test Message",
        confirmLabel: "Confirm",
        cancelLabel: "Cancel",
        onConfirm,
        onCancel,
        variant: "default" as const,
      };

      // Act
      useWorkoutStore.getState().showConfirmationModal(config);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.modalConfig?.title).toBe("Test Title");
      expect(state.modalConfig?.message).toBe("Test Message");
      expect(state.modalConfig?.confirmLabel).toBe("Confirm");
      expect(state.modalConfig?.cancelLabel).toBe("Cancel");
      expect(state.modalConfig?.onConfirm).toBe(onConfirm);
      expect(state.modalConfig?.onCancel).toBe(onCancel);
      expect(state.modalConfig?.variant).toBe("default");
    });
  });

  describe("hideConfirmationModal", () => {
    it("should set isModalOpen to false", () => {
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
    });

    it("should clear modalConfig", () => {
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
      expect(state.modalConfig).toBeNull();
    });

    it("should work when modal is already closed", () => {
      // Arrange
      useWorkoutStore.setState({
        isModalOpen: false,
        modalConfig: null,
      });

      // Act
      useWorkoutStore.getState().hideConfirmationModal();
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

      // Act & Assert - Initial state
      let state = useWorkoutStore.getState();
      expect(state.isModalOpen).toBe(false);
      expect(state.modalConfig).toBeNull();

      // Act & Assert - Open modal
      useWorkoutStore.getState().showConfirmationModal(config);
      state = useWorkoutStore.getState();
      expect(state.isModalOpen).toBe(true);
      expect(state.modalConfig).toEqual(config);

      // Act & Assert - Close modal
      useWorkoutStore.getState().hideConfirmationModal();
      state = useWorkoutStore.getState();
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

      // Act - Open first modal
      useWorkoutStore.getState().showConfirmationModal(firstConfig);

      // Act - Open second modal (replaces first)
      useWorkoutStore.getState().showConfirmationModal(secondConfig);
      const state = useWorkoutStore.getState();

      // Assert - Second modal config is active
      expect(state.isModalOpen).toBe(true);
      expect(state.modalConfig?.title).toBe("Second Modal");
      expect(state.modalConfig?.variant).toBe("destructive");
    });
  });
});
