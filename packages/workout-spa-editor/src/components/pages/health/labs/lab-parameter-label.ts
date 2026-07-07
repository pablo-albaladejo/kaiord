/**
 * Human label for a stored `parameterKey`: the catalog's `nameES (ABBREV)`
 * for a core parameter, or the de-slugged name for a free `custom:<slug>`.
 */
import {
  CUSTOM_PARAMETER_PREFIX,
  getLabParameter,
  isCustomParameterKey,
} from "@kaiord/core";

export const labParameterLabel = (parameterKey: string): string => {
  if (isCustomParameterKey(parameterKey)) {
    const slug = parameterKey.slice(CUSTOM_PARAMETER_PREFIX.length);
    return slug.replace(/-/g, " ").trim() || parameterKey;
  }
  const param = getLabParameter(parameterKey);
  return param ? `${param.nameES} (${param.abbrev})` : parameterKey;
};
