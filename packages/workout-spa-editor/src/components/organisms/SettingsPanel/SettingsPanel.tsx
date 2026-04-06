import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

import { AiTab } from "./AiTab";
import { GarminTab } from "./GarminTab";
import { PrivacyTab } from "./PrivacyTab";
import { TabButton } from "./TabButton";
import type { SettingsPanelProps, SettingsTab } from "./types";

const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: "ai", label: "AI" },
  { id: "garmin", label: "Garmin" },
  { id: "privacy", label: "Privacy" },
];

const TAB_CONTENT: Record<SettingsTab, React.FC> = {
  ai: AiTab,
  garmin: GarminTab,
  privacy: PrivacyTab,
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  open,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("ai");
  const ActiveContent = TAB_CONTENT[activeTab];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-full max-w-xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <Dialog.Title className="mb-4 text-lg font-semibold dark:text-white">
            Settings
          </Dialog.Title>
          <div
            role="tablist"
            className="mb-4 flex gap-1 border-b border-gray-200 dark:border-gray-700"
          >
            {TABS.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab.id}
                label={tab.label}
                active={activeTab === tab.id}
                onClick={setActiveTab}
              />
            ))}
          </div>
          <div role="tabpanel">
            <ActiveContent />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
