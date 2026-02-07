import { DeleteConfirmDialog } from "../DeleteConfirmDialog";
import { ImportExportActions } from "../ImportExportActions";
import { ProfileForm } from "../ProfileForm";
import { DialogHeader } from "./DialogHeader";
import { ProfileListSection } from "./ProfileListSection";
import { ProfileNotifications } from "./ProfileNotifications";
import type { Profile } from "../../../../types/profile";
import type { ProfileFormData } from "../types";

type ProfileManagerDialogProps = {
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
