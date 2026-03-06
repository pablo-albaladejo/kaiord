import { SportZoneEditor } from "../../ZoneEditor/SportZoneEditor";
import { DeleteConfirmDialog } from "../DeleteConfirmDialog";
import { ImportExportActions } from "../ImportExportActions";
import { ProfileForm } from "../ProfileForm";
import { DialogHeader } from "./DialogHeader";
import { ProfileListSection } from "./ProfileListSection";
import { ProfileNotifications } from "./ProfileNotifications";
import type { ProfileManagerDialogProps } from "./profile-manager-dialog-types";

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
      {editingProfile && <SportZoneEditor profileId={editingProfile.id} />}
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
