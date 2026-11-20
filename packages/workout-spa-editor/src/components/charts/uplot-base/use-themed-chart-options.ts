import { type DependencyList, useMemo } from "react";

import { useTheme } from "../../../contexts/ThemeContext";

/**
 * Memoised uPlot options that are also rebuilt when the resolved theme flips.
 * The option builders resolve ink colours from the stylesheet at build time,
 * so a `.dark` toggle needs a fresh object even when no input changed.
 */
export const useThemedChartOptions = <T>(
  build: () => T,
  deps: DependencyList
): T => {
  const { resolvedTheme } = useTheme();
  // The caller owns `deps`; `resolvedTheme` is the extra rebuild trigger.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(build, [...deps, resolvedTheme]);
};
