/**
 * ProfileEditView Component
 *
 * View shown when editing a profile, with Personal Data and Linked Accounts
 * tabs. Zones are edited on /athlete/zones/:sport, not here.
 */

import { useState } from "react";

import { useProfileByIdLive } from "../../../../hooks/use-profile-by-id-live";
import { useTranslate } from "../../../../i18n/use-translate";
import type { ProfileFormData } from "../types";
import { LinkedAccountsSection } from "./LinkedAccountsSection";
import { PersonalDataTab } from "./PersonalDataTab";
import type { ProfileTab } from "./ProfileTabs";
import { ProfileTabs } from "./ProfileTabs";

type ProfileEditViewProps = {
  profileId: string;
  formData: ProfileFormData;
  /** Updates form state AND persists in place (see ProfileManagerDialog). */
  onChange: (data: ProfileFormData) => void;
  onCancel: () => void;
};

export function ProfileEditView({
  profileId,
  formData,
  onChange,
  onCancel,
}: ProfileEditViewProps) {
  const t = useTranslate("athlete");
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  // Live read from Dexie via useLiveQuery — `undefined` covers both
  // loading (first mount) and "no row for this id" (deleted between
  // dialog open and now). Both cases hide the linked-accounts section,
  // matching legacy behavior.
  const profile = useProfileByIdLive(profileId);

  return (
    <>
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "personal" && (
        <PersonalDataTab formData={formData} onChange={onChange} />
      )}
      {activeTab === "linked-accounts" && profile && (
        <LinkedAccountsSection profile={profile} />
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
