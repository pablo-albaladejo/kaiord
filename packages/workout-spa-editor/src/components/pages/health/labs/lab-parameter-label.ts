/**
 * Human label for a stored `parameterKey`: the English display map's
 * `Name (ABBREV)` for a core parameter, or the de-slugged name for a free
 * `custom:<slug>`.
 */
import { CUSTOM_PARAMETER_PREFIX, isCustomParameterKey } from "@kaiord/core";

import {
  formatLabParameterLabel,
  getLabParameterDisplay,
} from "./lab-parameter-display";

export const labParameterLabel = (parameterKey: string): string => {
  if (isCustomParameterKey(parameterKey)) {
    const slug = parameterKey.slice(CUSTOM_PARAMETER_PREFIX.length);
    return slug.replace(/-/g, " ").trim() || parameterKey;
  }
  const display = getLabParameterDisplay(parameterKey);
  return display ? formatLabParameterLabel(display) : parameterKey;
};
