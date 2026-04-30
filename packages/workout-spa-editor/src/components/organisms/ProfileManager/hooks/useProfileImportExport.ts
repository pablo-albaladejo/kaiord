/**
 * useProfileImportExport Hook
 *
 * Profile import/export. Import uses the `createProfile` application
 * use case (so persistence rejection surfaces a user-visible error and
 * the I1 invariant — first profile becomes active — is preserved).
 */

import { createProfile } from "../../../../application/profile/create-profile";
import { usePersistence } from "../../../../contexts/persistence-context";
import type { Profile } from "../../../../types/profile";
import { profileSchema } from "../../../../types/profile";

type UseProfileImportExportParams = {
  setImportError: (error: string | null) => void;
};

export function useProfileImportExport(params: UseProfileImportExportParams) {
  const { setImportError } = params;
  const persistence = usePersistence();

  const handleExport = (profile: Profile) => {
    const dataStr = JSON.stringify(profile, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `profile-${profile.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const validatedProfile = profileSchema.parse(data);

      await createProfile(persistence, validatedProfile.name, {
        bodyWeight: validatedProfile.bodyWeight,
      });
      setImportError(null);
    } catch (error) {
      setImportError(
        `Import failed: ${error instanceof Error ? error.message : "Invalid profile file"}`
      );
    }

    event.target.value = "";
  };

  return { handleExport, handleImport };
}
