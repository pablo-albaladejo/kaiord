import { type KeyboardEvent, useRef, useState } from "react";

import { saveManualHealthMetric } from "../../../application/health/save-manual-health-metric.use-case";
import { updateProfile } from "../../../application/profile/update-profile";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import type { Profile } from "../../../types/profile";
import { todayIsoDate } from "../../../utils/today-iso-date";
import type { ProfileFormData } from "../../organisms/ProfileManager/types";

// Weight is not here: it is the current weight, recorded as a weigh-in.
const NUMERIC_KEYS = ["height", "restingHeartRate"] as const;
const SAVE_ERROR = "Failed to save profile — please retry.";

const toFormData = (profile: Profile): ProfileFormData => ({
  name: profile.name,
  height: profile.height,
  birthDate: profile.birthDate,
  sex: profile.sex,
  restingHeartRate: profile.restingHeartRate,
  activityLevel: profile.activityLevel,
});

export type ProfilePatch = Parameters<typeof updateProfile>[2];

export function useBodyForm(profileId: string, profile: Profile) {
  const persistence = usePersistence();
  const toast = useToastContext();
  const [form, setForm] = useState(() => toFormData(profile));
  const [saved, setSaved] = useState(false);
  const dirty = useRef(false);

  const track = (write: Promise<unknown>) => {
    setSaved(false);
    void write.then(
      () => setSaved(true),
      () => toast.error(SAVE_ERROR)
    );
  };

  const save = (patch: ProfilePatch) =>
    track(updateProfile(persistence, profileId, patch));

  // Same-day re-edits update today's weigh-in (the use case upserts by day).
  const recordWeight = (kg: number) =>
    track(
      saveManualHealthMetric(
        { persistence, profileId },
        { metric: "weight", day: todayIsoDate(), value: kg }
      ).then((result) => {
        if (!result) throw new Error("Invalid weight");
      })
    );

  const saveForm = (data: ProfileFormData) =>
    save({
      height: data.height,
      birthDate: data.birthDate,
      sex: data.sex,
      restingHeartRate: data.restingHeartRate,
      activityLevel: data.activityLevel,
    });

  // Numeric fields are typed digit by digit, so they are committed on blur or
  // Enter; the date and the selects are single choices and commit at once.
  const handleForm = (next: ProfileFormData) => {
    setForm(next);
    const typed = NUMERIC_KEYS.some((key) => next[key] !== form[key]);
    if (typed) {
      dirty.current = true;
      return;
    }
    dirty.current = false;
    saveForm(next);
  };

  const commit = () => {
    if (!dirty.current) return;
    dirty.current = false;
    saveForm(form);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") commit();
  };

  return {
    form,
    saved,
    save,
    recordWeight,
    handleForm,
    commit,
    handleKeyDown,
  };
}
