import { type KeyboardEvent, useRef, useState } from "react";

import { updateProfile } from "../../../application/profile/update-profile";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import type { Profile } from "../../../types/profile";
import type { ProfileFormData } from "../../organisms/ProfileManager/types";

const NUMERIC_KEYS = ["bodyWeight", "height", "restingHeartRate"] as const;
const SAVE_ERROR = "Failed to save profile — please retry.";

const toFormData = (profile: Profile): ProfileFormData => ({
  name: profile.name,
  bodyWeight: profile.bodyWeight,
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

  const save = (patch: ProfilePatch) => {
    setSaved(false);
    void updateProfile(persistence, profileId, patch).then(
      () => setSaved(true),
      () => toast.error(SAVE_ERROR)
    );
  };

  const saveForm = (data: ProfileFormData) =>
    save({
      bodyWeight: data.bodyWeight,
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

  return { form, saved, save, handleForm, commit, handleKeyDown };
}
