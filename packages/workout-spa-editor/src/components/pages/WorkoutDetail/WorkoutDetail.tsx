import { useCallback } from "react";
import { useLocation, useSearch } from "wouter";

import { parseBackOrigin } from "../../../routing/back-origin";
import { resolveBackTarget } from "../../../routing/resolve-back-target";
import { withOrigin } from "../../../routing/with-origin";
import { RouteSpinner } from "../../atoms/RouteSpinner";
import { useWorkoutDetailModel } from "./use-workout-detail-model";
import { useWorkoutDetailRecord } from "./use-workout-detail-record";
import { WorkoutDetailNotFound } from "./WorkoutDetailNotFound";
import { WorkoutDetailView } from "./WorkoutDetailView";

export type WorkoutDetailProps = { id?: string };

export default function WorkoutDetail({ id }: WorkoutDetailProps) {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const origin = parseBackOrigin(params.get("from"));
  const weekParam = params.get("week");
  const { record, loading } = useWorkoutDetailRecord(id);
  const model = useWorkoutDetailModel(record);

  const onBack = useCallback(
    () => navigate(resolveBackTarget({ origin, week: weekParam })),
    [navigate, origin, weekParam]
  );
  const onEdit = useCallback(
    () => id && navigate(withOrigin(`/workout/${id}`, "detail")),
    [navigate, id]
  );

  if (loading) return <RouteSpinner />;
  if (!record) return <WorkoutDetailNotFound onBack={onBack} />;

  return (
    <WorkoutDetailView
      record={record}
      model={model}
      onBack={onBack}
      onEdit={onEdit}
    />
  );
}
