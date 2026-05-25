/**
 * useAddEntryChooser — owns the two-step add-entry surface state.
 *
 * `handleAddClick(date)` opens the chooser for a day. Choosing Workout
 * navigates to `/workout/new?date=`; choosing Wellness closes the
 * chooser and opens the wellness entry dialog for the same date.
 */

import { useCallback, useState } from "react";
import { useLocation } from "wouter";

export function useAddEntryChooser() {
  const [, navigate] = useLocation();
  const [addEntryDate, setAddEntryDate] = useState<string | null>(null);
  const [wellnessDate, setWellnessDate] = useState<string | null>(null);

  const handleAddClick = useCallback((date: string) => {
    setAddEntryDate(date);
  }, []);

  const handleChooseWorkout = useCallback(() => {
    if (addEntryDate) navigate(`/workout/new?date=${addEntryDate}`);
    setAddEntryDate(null);
  }, [addEntryDate, navigate]);

  const handleChooseWellness = useCallback(() => {
    setWellnessDate(addEntryDate);
    setAddEntryDate(null);
  }, [addEntryDate]);

  return {
    addEntryDate,
    wellnessDate,
    setAddEntryDate,
    setWellnessDate,
    handleAddClick,
    handleChooseWorkout,
    handleChooseWellness,
  };
}
