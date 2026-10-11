import { useCallback, useState } from "react";
import { useLocation, useSearch } from "wouter";

import { parseBackOrigin } from "../../../routing/back-origin";
import { resolveBackTarget } from "../../../routing/resolve-back-target";
import { withOrigin } from "../../../routing/with-origin";
import { RouteSpinner } from "../../atoms/RouteSpinner";
import { useDeleteWorkoutWithUndo } from "./use-delete-workout-with-undo";
import { useMoveWorkout } from "./use-move-workout";
import { useWorkoutDetailModel } from "./use-workout-detail-model";
import { useWorkoutDetailRecord } from "./use-workout-detail-record";
import {
  type DetailDialog,
  WorkoutDetailDialogs,
} from "./WorkoutDetailDialogs";
import { WorkoutDetailNotFound } from "./WorkoutDetailNotFound";
import { WorkoutDetailView } from "./WorkoutDetailView";

export type WorkoutDetailProps = { id?: string };

export default function WorkoutDetail({ id }: WorkoutDetailProps) {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(useSearch());
  const origin = parseBackOrigin(params.get("from"));
  const weekParam = params.get("week");
  const { record, placementRow, loading, notFound } =
    useWorkoutDetailRecord(id);
  const model = useWorkoutDetailModel(record);
  const [dialog, setDialog] = useState<DetailDialog>(null);

  const onBack = useCallback(
    () => navigate(resolveBackTarget({ origin, week: weekParam })),
    [navigate, origin, weekParam]
  );
  const onEdit = useCallback(
    () => id && navigate(withOrigin(`/workout/${id}`, "detail")),
    [navigate, id]
  );
  const deleteWithUndo = useDeleteWorkoutWithUndo(onBack);
  const moveWorkout = useMoveWorkout();

  if (loading) return <RouteSpinner />;
  if (notFound || !record) return <WorkoutDetailNotFound onBack={onBack} />;

  return (
    <>
      <WorkoutDetailView
        record={record}
        placementRow={placementRow}
        model={model}
        onBack={onBack}
        onEdit={onEdit}
        onMove={() => setDialog("move")}
        onDelete={() => setDialog("delete")}
      />
      <WorkoutDetailDialogs
        record={record}
        title={model?.title ?? record.sport}
        onGarmin={placementRow !== undefined}
        open={dialog}
        onClose={() => setDialog(null)}
        onMove={(date) => {
          setDialog(null);
          void moveWorkout(record.id, date);
        }}
        onDelete={() => {
          setDialog(null);
          void deleteWithUndo(record);
        }}
      />
    </>
  );
}
