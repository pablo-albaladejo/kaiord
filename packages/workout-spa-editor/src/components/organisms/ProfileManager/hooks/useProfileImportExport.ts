/**
 * useProfileImportExport Hook
 *
 * Profile import/export functionality.
 */

import { profileSchema } from "../../../../types/profile";
import type { Profile } from "../../../../types/profile";

type UseProfileImportExportParams = {
  createProfile: (
    name: string,
    data: {
      bodyWeight?: number;
      ftp?: number;
      maxHeartRate?: number;
    }
  ) => void;
  setImportError: (error: string | null) => void;
};

export function useProfileImportExport(params: UseProfileImportExportParams) {
  const { createProfile, setImportError } = params;

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

      createProfile(validatedProfile.name, {
        bodyWeight: validatedProfile.bodyWeight,
        ftp: validatedProfile.ftp,
        maxHeartRate: validatedProfile.maxHeartRate,
      });

      setImportError(null);
    } catch (error) {
      if (error instanceof Error) {
        setImportError(`Import failed: ${error.message}`);
      } else {
        setImportError("Import failed: Invalid profile file");
      }
    }

    event.target.value = "";
  };

  return {
    handleExport,
    handleImport,
  };
}
