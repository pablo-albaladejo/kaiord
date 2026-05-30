import { useCallback } from "react";
import { useLocation } from "wouter";

import { RouteSpinner } from "../../atoms/RouteSpinner";
import { useWorkoutDetailModel } from "./use-workout-detail-model";
import { useWorkoutDetailRecord } from "./use-workout-detail-record";
import { WorkoutDetailNotFound } from "./WorkoutDetailNotFound";
import { WorkoutDetailView } from "./WorkoutDetailView";

export type WorkoutDetailProps = { id?: string };

export default function WorkoutDetail({ id }: WorkoutDetailProps) {
  const [, navigate] = useLocation();
  const { record, loading } = useWorkoutDetailRecord(id);
  const model = useWorkoutDetailModel(record);

  const onBack = useCallback(() => navigate("/calendar"), [navigate]);
  const onEdit = useCallback(
    () => id && navigate(`/workout/${id}`),
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
