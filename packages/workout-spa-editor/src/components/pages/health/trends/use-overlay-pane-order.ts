import { arrayMove } from "@dnd-kit/sortable";
import { useCallback, useEffect, useRef, useState } from "react";

import { TREND_METRICS, type TrendMetricKey } from "./trend-metrics";

const initialFromSelected = (
  selected: ReadonlySet<TrendMetricKey>
): TrendMetricKey[] =>
  TREND_METRICS.map((m) => m.key).filter((k) => selected.has(k));

export type UseOverlayPaneOrderResult = {
  paneOrder: TrendMetricKey[];
  reorder: (from: TrendMetricKey, to: TrendMetricKey) => void;
};

export const useOverlayPaneOrder = (
  selected: ReadonlySet<TrendMetricKey>
): UseOverlayPaneOrderResult => {
  const [paneOrder, setPaneOrder] = useState<TrendMetricKey[]>(() =>
    initialFromSelected(selected)
  );
  const prevSelected = useRef(selected);

  useEffect(() => {
    if (prevSelected.current === selected) return;
    prevSelected.current = selected;
    setPaneOrder((prev) => {
      // Drop deselected metrics, preserving the user-reordered positions of
      // metrics that are still selected.
      const kept = prev.filter((k) => selected.has(k));
      // Append metrics newly added to `selected` in canonical TREND_METRICS
      // order so toggling on appends at the end.
      const added = TREND_METRICS.map((m) => m.key).filter(
        (k) => selected.has(k) && !kept.includes(k)
      );
      return [...kept, ...added];
    });
  }, [selected]);

  const reorder = useCallback((from: TrendMetricKey, to: TrendMetricKey) => {
    setPaneOrder((prev) => {
      const fromIdx = prev.indexOf(from);
      const toIdx = prev.indexOf(to);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      return arrayMove(prev, fromIdx, toIdx);
    });
  }, []);

  return { paneOrder, reorder };
};
