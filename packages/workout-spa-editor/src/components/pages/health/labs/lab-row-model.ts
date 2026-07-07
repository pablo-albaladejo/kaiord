/**
 * LabRowState — one parameter row's ephemeral form state, plus the simple
 * field transitions. UI-only (never persisted) so `useLabEntryForm` stays a
 * thin `useState` wrapper. Catalog/custom identity transitions that need
 * the parameter catalog live in `lab-row-parameter-selection.ts`.
 */
export type LabRowMode = "catalog" | "custom";

export type LabRowState = {
  rowId: string;
  mode: LabRowMode;
  catalogLabel: string;
  customName: string;
  parameterKey: string;
  valueRaw: string;
  unitRaw: string;
  refLowRaw: string;
  refHighRaw: string;
  refTouched: boolean;
};

export const createEmptyRow = (rowId: string): LabRowState => ({
  rowId,
  mode: "catalog",
  catalogLabel: "",
  customName: "",
  parameterKey: "",
  valueRaw: "",
  unitRaw: "",
  refLowRaw: "",
  refHighRaw: "",
  refTouched: false,
});

/** Switching identity mode resets identity + measurement fields (stale mix guard). */
export const setRowMode = (
  row: LabRowState,
  mode: LabRowMode
): LabRowState => ({
  ...createEmptyRow(row.rowId),
  mode,
});

export const setValueRaw = (
  row: LabRowState,
  valueRaw: string
): LabRowState => ({
  ...row,
  valueRaw,
});

export const setUnitRaw = (row: LabRowState, unitRaw: string): LabRowState => ({
  ...row,
  unitRaw,
});

export const setRefLowRaw = (
  row: LabRowState,
  refLowRaw: string
): LabRowState => ({
  ...row,
  refLowRaw,
  refTouched: true,
});

export const setRefHighRaw = (
  row: LabRowState,
  refHighRaw: string
): LabRowState => ({
  ...row,
  refHighRaw,
  refTouched: true,
});
