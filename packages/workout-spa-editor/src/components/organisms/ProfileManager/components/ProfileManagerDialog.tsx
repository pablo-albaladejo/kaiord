/**
 * ProfileManagerDialog Component
 *
 * Dialog content for the profile manager.
 */

import type { Profile } from "../../../../types/profile";
import { DeleteConfirmDialog } from "../DeleteConfirmDialog";
import { ImportExportActions } from "../ImportExportActions";
import { ProfileForm } from "../ProfileForm";
import { DialogHeader } from "./DialogHeader";
import { ProfileListSection } from "./ProfileListSection";
import { ProfileNotifications } from "./ProfileNotifications";

type ProfileManagerDialogProps = {
  profiles: Profile[];
  activeProfileId: string | null;
  editingProfile: Profile | null;
  formData: Partial<Profile>;
  deleteConfirmId: string | null;
  importError: string | null;
  switchNotification: string | null;
  setFormData: (data: Partial<Profile>) => void;
  handleCreate: () => void;
  handleEdit: (profile: Profile) => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleSwitchProfile: (profileId: string) => void;
  handleDelete: (profileId: string) => void;
  confirmDelete: () => void;
  handleExport: (profile: Profile) => void;
  handleImport: (file: File) => void;
  setDeleteConfirmId: (id: string | null) => void;
};

export function ProfileManagerDialog({
  profiles,
  activeProfileId,
  editingProfile,
  formData,
  deleteConfirmId,
  importError,
  switchNotification,
  setFormData,
  handleCreate,
  handleEdit,
  handleSave,
  handleCancel,
  handleSwitchProfile,
  handleDelete,
  confirmDelete,
  handleExport,
  handleImport,
  setDeleteConfirmId,
}: ProfileManagerDialogProps) {
  return (
    <>
      <DialogHeader />

      <ProfileNotifications
        importError={importError}
        switchNotification={switchNotification}
      />

      <ProfileForm
        formData={formData}
        editingProfile={editingProfile}
        onFormDataChange={setFormData}
        onCreate={handleCreate}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      <ImportExportActions onImport={handleImport} />

      <ProfileListSection
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSwitch={handleSwitchProfile}
        onEdit={handleEdit}
        onExport={handleExport}
        onDelete={handleDelete}
      />

      <DeleteConfirmDialog
        open={!!deleteConfirmId}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </>
  );
}
