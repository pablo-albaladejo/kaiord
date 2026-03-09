/**
 * ProfileManagerDialog Component
 *
 * Redesigned layout with inline name, tabs, and zones as primary view.
 */

import { CreateProfileSection } from "./CreateProfileSection";
import { DeleteConfirmDialog } from "../DeleteConfirmDialog";
import { DialogHeader } from "./DialogHeader";
import { ImportExportActions } from "../ImportExportActions";
import { ProfileEditView } from "./ProfileEditView";
import { ProfileListSection } from "./ProfileListSection";
import { ProfileNotifications } from "./ProfileNotifications";
import type { ProfileManagerDialogProps } from "./profile-manager-dialog-types";

export function ProfileManagerDialog(props: ProfileManagerDialogProps) {
  const { editingProfile, formData, setFormData, handleSave } = props;

  const handleNameChange = (name: string) => {
    const nextFormData = { ...formData, name };
    setFormData(nextFormData);
    if (editingProfile) handleSave(nextFormData);
  };

  return (
    <>
      <DialogHeader
        profileName={editingProfile ? formData.name : undefined}
        onNameChange={editingProfile ? handleNameChange : undefined}
      />
      <ProfileNotifications
        importError={props.importError}
        switchNotification={props.switchNotification}
      />
      {editingProfile ? (
        <ProfileEditView
          profileId={editingProfile.id}
          formData={formData}
          setFormData={setFormData}
          onCancel={props.handleCancel}
        />
      ) : (
        <ProfileListView {...props} />
      )}
      <DeleteConfirmDialog
        open={!!props.deleteConfirmId}
        onConfirm={props.confirmDelete}
        onCancel={() => props.setDeleteConfirmId(null)}
      />
    </>
  );
}

function ProfileListView(props: ProfileManagerDialogProps) {
  return (
    <>
      <CreateProfileSection
        formData={props.formData}
        setFormData={props.setFormData}
        onCreate={props.handleCreate}
      />
      <ImportExportActions onImport={props.handleImport} />
      <ProfileListSection
        profiles={props.profiles}
        activeProfileId={props.activeProfileId}
        onSwitch={props.handleSwitchProfile}
        onEdit={props.handleEdit}
        onExport={props.handleExport}
        onDelete={props.handleDelete}
      />
    </>
  );
}
