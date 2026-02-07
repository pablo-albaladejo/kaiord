/**
 * ProfileForm Component
 *
 * Form for creating or editing a profile.
 */

import { ProfileFormActions } from "./components/ProfileFormActions";
import { ProfileFormFields } from "./components/ProfileFormFields";
import type { Profile } from "../../../types/profile";

type ProfileFormData = {
  name: string;
  bodyWeight?: number;
  ftp?: number;
  maxHeartRate?: number;
};

type ProfileFormProps = {
  formData: ProfileFormData;
  editingProfile: Profile | null;
  onFormDataChange: (data: ProfileFormData) => void;
  onCreate: () => void;
  onSave: () => void;
  onCancel: () => void;
};

export function ProfileForm({
  formData,
  editingProfile,
  onFormDataChange,
  onCreate,
  onSave,
  onCancel,
}: ProfileFormProps) {
  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
        {editingProfile ? "Edit Profile" : "Create New Profile"}
      </h3>
      <div className="space-y-3">
        <ProfileFormFields
          formData={formData}
          onFormDataChange={onFormDataChange}
        />
        <ProfileFormActions
          editingProfile={editingProfile}
          isNameValid={!!formData.name.trim()}
          onCreate={onCreate}
          onSave={onSave}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}
