import { Download, Pencil } from "lucide-react";
import type { Ref } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { Profile } from "../../../types/profile";
import { Button } from "../../atoms/Button";
import { ActiveAthleteControl } from "./ActiveAthleteControl";
import { DeleteAthleteButton } from "./DeleteAthleteButton";

type AthleteRowActionsProps = {
  profile: Profile;
  isActive: boolean;
  isOnly: boolean;
  renameRef: Ref<HTMLButtonElement>;
  onRename: () => void;
  onSwitched: (message: string) => void;
  onExport: (profile: Profile) => void;
  onDelete: (profileId: string) => void;
};

const ICON = "h-4 w-4";

export function AthleteRowActions(props: AthleteRowActionsProps) {
  const { profile, isActive, isOnly } = props;
  const t = useTranslate("athlete");
  const name = profile.name;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <ActiveAthleteControl
        profile={profile}
        isActive={isActive}
        onSwitched={props.onSwitched}
      />
      <Button
        ref={props.renameRef}
        variant="tertiary"
        size="sm"
        onClick={props.onRename}
        aria-label={t("athletes.rename", { name })}
      >
        <Pencil className={ICON} aria-hidden="true" />
      </Button>
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => props.onExport(profile)}
        aria-label={t("athletes.export", { name })}
      >
        <Download className={ICON} aria-hidden="true" />
      </Button>
      <DeleteAthleteButton
        name={name}
        isOnly={isOnly}
        onDelete={() => props.onDelete(profile.id)}
      />
    </div>
  );
}
