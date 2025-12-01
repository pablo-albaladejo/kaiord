/**
 * Value Extraction Helpers
 *
 * Functions to extract values from Target objects.
 */

import type { Target } from "../../../types/krd";

export const getCurrentUnit = (value: Target | null): string => {
  if (!value || value.type === "open") return "";
  return value.value.unit;
};

export const getValueString = (value: Target | null): string => {
  if (!value || value.type === "open") return "";
  if (value.value.unit === "range") return "";
  return String(value.value.value || "");
};

export const getRangeMinString = (value: Target | null): string => {
  if (!value || value.type === "open") return "";
  if (value.value.unit !== "range") return "";
  return String(value.value.min || "");
};

export const getRangeMaxString = (value: Target | null): string => {
  if (!value || value.type === "open") return "";
  if (value.value.unit !== "range") return "";
  return String(value.value.max || "");
};
