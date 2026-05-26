import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useMemo } from "react";

import type { TrendMetricKey } from "./trend-metrics";

export type UseOverlayPaneDndArgs = {
  paneOrder: TrendMetricKey[];
  reorder: (from: TrendMetricKey, to: TrendMetricKey) => void;
};

export const useOverlayPaneDnd = ({
  paneOrder,
  reorder,
}: UseOverlayPaneDndArgs) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortableIds = useMemo(() => paneOrder, [paneOrder]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      reorder(active.id as TrendMetricKey, over.id as TrendMetricKey);
    },
    [reorder]
  );

  return { sensors, sortableIds, handleDragEnd };
};
