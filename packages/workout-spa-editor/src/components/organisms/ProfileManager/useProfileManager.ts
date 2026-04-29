/**
 * useProfileManager Hook
 *
 * Business logic for profile management. After Phase 1B reads come
 * from Dexie via the live hooks (`useProfilesLive`,
 * `useActiveProfileLive`) and writes go through the application use
 * cases — every callsite returns a promise, errors surface via the
 * toast context inside the leaf hooks.
 *
 * `useLiveQuery` returns `undefined` while loading on first mount;
 * consumers receive an empty profiles array and a null active id
 * during the loading window.
 */

import { useState } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useProfilesLive } from "../../../hooks/use-profiles-live";
import type { Profile } from "../../../types/profile";
import { useProfileActions } from "./hooks/useProfileActions";
import { useProfileImportExport } from "./hooks/useProfileImportExport";
import type { ProfileFormData } from "./types";

export function useProfileManager() {
  const profiles = useProfilesLive() ?? [];
  const activeProfileId = useActiveProfileLive()?.id ?? null;

  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({ name: "" });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [switchNotification, setSwitchNotification] = useState<string | null>(
    null
  );

  const actions = useProfileActions({
    profiles,
    formData,
    editingProfile,
    setFormData,
    setEditingProfile,
    setDeleteConfirmId,
    setSwitchNotification,
  });

  const importExport = useProfileImportExport({ setImportError });

  return {
    profiles,
    activeProfileId,
    editingProfile,
    formData,
    deleteConfirmId,
    importError,
    switchNotification,
    setFormData,
    handleCreate: actions.handleCreate,
    handleEdit: actions.handleEdit,
    handleSave: actions.handleSave,
    handleCancel: actions.handleCancel,
    handleSwitchProfile: actions.handleSwitchProfile,
    handleDelete: actions.handleDelete,
    confirmDelete: () => actions.confirmDelete(deleteConfirmId),
    handleExport: importExport.handleExport,
    handleImport: importExport.handleImport,
    setDeleteConfirmId,
  };
}
