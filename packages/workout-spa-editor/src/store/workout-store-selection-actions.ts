/**
 * Creates selection-related action handlers for the workout store
 */
export function createSelectionActions(
  set: (partial: Partial<unknown>) => void
) {
  return {
    selectStep: (id: string | null) =>
      set({ selectedStepId: id, selectedStepIds: [] }),
    toggleStepSelection: (id: string) =>
      set((state: { selectedStepIds: Array<string> }) => {
        const isSelected = state.selectedStepIds.includes(id);
        return {
          selectedStepIds: isSelected
            ? state.selectedStepIds.filter((stepId) => stepId !== id)
            : [...state.selectedStepIds, id],
          selectedStepId: null,
        };
      }),
    clearStepSelection: () => set({ selectedStepIds: [] }),
  };
}
