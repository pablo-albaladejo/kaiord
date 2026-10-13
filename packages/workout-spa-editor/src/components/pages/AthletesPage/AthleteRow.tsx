import { useState } from "react";

import { useRenameAthlete } from "../../../hooks/use-rename-athlete";
import { useTranslate } from "../../../i18n/use-translate";
import type { Profile } from "../../../types/profile";
import { Pill } from "../../atoms/Pill";
import { InlineNameEdit } from "../../molecules/InlineNameEdit";
import { AthleteRowActions } from "./AthleteRowActions";
import { AthleteSummary } from "./AthleteSummary";

type AthleteRowProps = {
  profile: Profile;
  isActive: boolean;
  isOnly: boolean;
  onExport: (profile: Profile) => void;
  onDelete: (profileId: string) => void;
};

export function AthleteRow({ profile, isActive, ...actions }: AthleteRowProps) {
  const t = useTranslate("athlete");
  const rename = useRenameAthlete();
  const [renaming, setRenaming] = useState(false);

  return (
    <li
      data-testid={`athlete-row-${profile.id}`}
      className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${
        isActive
          ? "border-accent bg-surface-elevated"
          : "border-edge bg-surface"
      }`}
    >
      {renaming ? (
        <InlineNameEdit
          value={profile.name}
          label={t("athletes.rename", { name: profile.name })}
          onSave={(name) => rename(profile.id, name)}
          onDone={() => setRenaming(false)}
        />
      ) : (
        <>
          <div className="min-w-0 flex-1 basis-40">
            <p className="m-0 flex items-center gap-2 font-medium text-ink-strong">
              <span className="truncate">{profile.name}</span>
              {isActive && <Pill tone="accent">{t("athletes.active")}</Pill>}
            </p>
            <AthleteSummary profile={profile} />
          </div>
          <AthleteRowActions
            profile={profile}
            isActive={isActive}
            onRename={() => setRenaming(true)}
            {...actions}
          />
        </>
      )}
    </li>
  );
}
