/**
 * ProfileManager Component
 *
 * Manages user profiles with create, edit, delete, and import/export functionality.
 *
 * Requirements:
 * - Requirement 9: User profile management with training zones
 * - Requirement 38: Profile import/export functionality
 */

import * as Dialog from "@radix-ui/react-dialog";
import { Download, Plus, Trash2, Upload, User, X } from "lucide-react";
import { useState } from "react";
import { useProfileStore } from "../../../store/profile-store";
import type { Profile } from "../../../types/profile";
import { profileSchema } from "../../../types/profile";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";

// ============================================
// Types
// ============================================

export type ProfileManagerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ProfileFormData = {
  name: string;
  bodyWeight?: number;
  ftp?: number;
  maxHeartRate?: number;
};

// ============================================
// Component
// ============================================

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  open,
  onOpenChange,
}) => {
  const {
    profiles,
    activeProfileId,
    createProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
  } = useProfileStore();

  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [switchNotification, setSwitchNotification] = useState<string | null>(
    null
  );

  // Handle create new profile
  const handleCreate = () => {
    if (formData.name.trim()) {
      createProfile(formData.name.trim(), {
        bodyWeight: formData.bodyWeight,
        ftp: formData.ftp,
        maxHeartRate: formData.maxHeartRate,
      });
      setFormData({ name: "" });
    }
  };

  // Handle edit profile
  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      bodyWeight: profile.bodyWeight,
      ftp: profile.ftp,
      maxHeartRate: profile.maxHeartRate,
    });
  };

  // Handle save edited profile
  const handleSave = () => {
    if (editingProfile && formData.name.trim()) {
      updateProfile(editingProfile.id, {
        name: formData.name.trim(),
        bodyWeight: formData.bodyWeight,
        ftp: formData.ftp,
        maxHeartRate: formData.maxHeartRate,
      });
      setEditingProfile(null);
      setFormData({ name: "" });
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setEditingProfile(null);
    setFormData({ name: "" });
  };

  // Handle profile switch with notification
  const handleSwitchProfile = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (profile) {
      setActiveProfile(profileId);
      setSwitchNotification(`Switched to profile: ${profile.name}`);
      setTimeout(() => setSwitchNotification(null), 3000);
    }
  };

  // Handle delete profile
  const handleDelete = (profileId: string) => {
    setDeleteConfirmId(profileId);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteProfile(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  // Handle export profile
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

  // Handle import profile
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const validatedProfile = profileSchema.parse(data);

      // Create new profile with imported data
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

    // Reset file input
    event.target.value = "";
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
              Profile Manager
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-gray-950"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Manage your training profiles with FTP, max heart rate, and zones.
          </Dialog.Description>

          {/* Import Error */}
          {importError && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {importError}
            </div>
          )}

          {/* Profile Switch Notification */}
          {switchNotification && (
            <div
              className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400"
              role="status"
              aria-live="polite"
            >
              {switchNotification}
            </div>
          )}

          {/* Profile Form */}
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
              {editingProfile ? "Edit Profile" : "Create New Profile"}
            </h3>
            <div className="space-y-3">
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter profile name"
                required
              />
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Body Weight (kg)"
                  type="number"
                  value={formData.bodyWeight?.toString() ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bodyWeight: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="70"
                />
                <Input
                  label="FTP (watts)"
                  type="number"
                  value={formData.ftp?.toString() ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ftp: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="250"
                />
                <Input
                  label="Max HR (bpm)"
                  type="number"
                  value={formData.maxHeartRate?.toString() ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxHeartRate: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="190"
                />
              </div>
              <div className="flex gap-2">
                {editingProfile ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={!formData.name.trim()}
                    >
                      Save Changes
                    </Button>
                    <Button variant="secondary" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleCreate}
                    disabled={!formData.name.trim()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Profile
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Import/Export Buttons */}
          <div className="mb-4 flex gap-2">
            <label htmlFor="import-profile" className="cursor-pointer">
              <Button variant="secondary" as="span">
                <Upload className="mr-2 h-4 w-4" />
                Import Profile
              </Button>
            </label>
            <input
              id="import-profile"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="sr-only"
              aria-label="Import profile file"
            />
          </div>

          {/* Profile List */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Saved Profiles ({profiles.length})
            </h3>
            {profiles.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No profiles yet. Create one to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      profile.id === activeProfileId
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {profile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {profile.ftp && `FTP: ${profile.ftp}W`}
                          {profile.ftp && profile.maxHeartRate && " • "}
                          {profile.maxHeartRate &&
                            `Max HR: ${profile.maxHeartRate} bpm`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {profile.id !== activeProfileId && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSwitchProfile(profile.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEdit(profile)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleExport(profile)}
                        aria-label="Export profile"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDelete(profile.id)}
                        disabled={profiles.length === 1}
                        aria-label="Delete profile"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete Confirmation Dialog */}
          {deleteConfirmId && (
            <Dialog.Root
              open={!!deleteConfirmId}
              onOpenChange={(open) => !open && setDeleteConfirmId(null)}
            >
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border border-gray-200 bg-white p-6 shadow-lg sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Profile
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete this profile? This action
                    cannot be undone.
                  </Dialog.Description>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={confirmDelete}>Delete</Button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
