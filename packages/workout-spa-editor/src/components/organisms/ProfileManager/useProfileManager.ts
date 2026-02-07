/**
 * useProfileManager Hook
 *
 * Business logic for profile management.
 */

import { useState } from "react";
import { useProfileActions } from "./hooks/useProfileActions";
import { useProfileImportExport } from "./hooks/useProfileImportExport";
import { useProfileStore } from "../../../store/profile-store";
import type { Profile } from "../../../types/profile";

type ProfileFormData = {
  name: string;
  bodyWeight?: number;
  ftp?: number;
  maxHeartRate?: number;
};

export function useProfileManager() {
  const {
    profiles,
    activeProfileId,
    createProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
  } = useProfileStore();

  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({ name: "" });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [switchNotification, setSwitchNotification] = useState<string | null>(
    null
  );

  const actions = useProfileActions({
    createProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
    profiles,
    formData,
    editingProfile,
    setFormData,
    setEditingProfile,
    setDeleteConfirmId,
    setSwitchNotification,
  });

  const importExport = useProfileImportExport({
    createProfile,
    setImportError,
  });

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
