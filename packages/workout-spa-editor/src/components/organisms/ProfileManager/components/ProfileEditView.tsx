/**
 * ProfileEditView Component
 *
 * View shown when editing a profile, with Training Zones and Personal Data tabs.
 */

import { useState } from "react";

import { SportZoneEditor } from "../../ZoneEditor/SportZoneEditor";
import type { ProfileFormData } from "../types";
import { PersonalDataTab } from "./PersonalDataTab";
import type { ProfileTab } from "./ProfileTabs";
import { ProfileTabs } from "./ProfileTabs";

type ProfileEditViewProps = {
  profileId: string;
  formData: ProfileFormData;
  setFormData: (data: ProfileFormData) => void;
  onCancel: () => void;
};

export function ProfileEditView({
  profileId,
  formData,
  setFormData,
  onCancel,
}: ProfileEditViewProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("zones");

  return (
    <>
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "zones" && <SportZoneEditor profileId={profileId} />}
      {activeTab === "personal" && (
        <PersonalDataTab
          bodyWeight={formData.bodyWeight}
          onBodyWeightChange={(bw) =>
            setFormData({ ...formData, bodyWeight: bw })
          }
        />
      )}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Back to List
        </button>
      </div>
    </>
  );
}
