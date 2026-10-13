/**
 * ProfileEditView Component
 *
 * View shown when editing a profile: Personal Data. Zones are edited on
 * /athlete/zones/:sport and external accounts on /connections, not here.
 */

import { useState } from "react";

import { useTranslate } from "../../../../i18n/use-translate";
import type { ProfileFormData } from "../types";
import { PersonalDataTab } from "./PersonalDataTab";
import type { ProfileTab } from "./ProfileTabs";
import { ProfileTabs } from "./ProfileTabs";

type ProfileEditViewProps = {
  formData: ProfileFormData;
  /** Updates form state AND persists in place (see ProfileManagerDialog). */
  onChange: (data: ProfileFormData) => void;
  onCancel: () => void;
};

export function ProfileEditView({
  formData,
  onChange,
  onCancel,
}: ProfileEditViewProps) {
  const t = useTranslate("athlete");
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");

  return (
    <>
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "personal" && (
        <PersonalDataTab formData={formData} onChange={onChange} />
      )}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          {t("profileManager.backToList")}
        </button>
      </div>
    </>
  );
}
