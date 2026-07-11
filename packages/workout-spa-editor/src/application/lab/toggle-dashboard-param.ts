/**
 * Pure toggle logic for the F5 dashboard's pinned-parameter selection.
 * Kept side-effect free so the persistence write (`userPreferences`) and
 * the pin/unpin UI stay independently testable. No cap is imposed — the
 * selection is naturally bounded by how many distinct parameters the
 * profile has ever recorded (`getLatestValues`).
 */
export const toggleDashboardParam = (
  current: readonly string[] | undefined,
  parameterKey: string
): string[] => {
  const list = current ?? [];
  return list.includes(parameterKey)
    ? list.filter((key) => key !== parameterKey)
    : [...list, parameterKey];
};
