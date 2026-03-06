/**
 * ProfileManagerDialog Types
 */

import type { Profile } from "../../../../types/profile";
import type { ProfileFormData } from "../types";

export type ProfileManagerDialogProps = {
  profiles: Profile[];
  activeProfileId: string | null;
  editingProfile: Profile | null;
  formData: ProfileFormData;
  deleteConfirmId: string | null;
  importError: string | null;
  switchNotification: string | null;
  setFormData: (data: ProfileFormData) => void;
  setDeleteConfirmId: (id: string | null) => void;
  handleCreate: () => void;
  handleEdit: (profile: Profile) => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleSwitchProfile: (profileId: string) => void;
  handleDelete: (profileId: string) => void;
  confirmDelete: () => void;
  handleExport: (profile: Profile) => void;
  handleImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
};
