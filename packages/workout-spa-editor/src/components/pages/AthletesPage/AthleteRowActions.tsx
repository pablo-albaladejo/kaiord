import { Download, Pencil, Trash2 } from "lucide-react";
import { Link } from "wouter";

import { useProfileSwitch } from "../../../hooks/use-profile-switch";
import { useTranslate } from "../../../i18n/use-translate";
import type { Profile } from "../../../types/profile";
import { Button } from "../../atoms/Button";

type AthleteRowActionsProps = {
  profile: Profile;
  isActive: boolean;
  isOnly: boolean;
  onRename: () => void;
  onExport: (profile: Profile) => void;
  onDelete: (profileId: string) => void;
};

const ICON = "h-4 w-4";
const LINK_CLASS =
  "text-[13px] font-medium text-ink-strong underline underline-offset-2";

export function AthleteRowActions(props: AthleteRowActionsProps) {
  const { profile, isActive, isOnly } = props;
  const t = useTranslate("athlete");
  const { handleSwitchProfile } = useProfileSwitch({
    profiles: [profile],
    setSwitchNotification: () => undefined,
  });
  const name = profile.name;

  return (
    <div className="flex items-center gap-2">
      {isActive ? (
        <Link href="/athlete" className={LINK_CLASS}>
          {t("athletes.editDetails")}
        </Link>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleSwitchProfile(profile.id)}
          aria-label={t("athletes.setActiveFor", { name })}
        >
          {t("athletes.setActive")}
        </Button>
      )}
      <Button
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
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => props.onDelete(profile.id)}
        disabled={isOnly}
        title={isOnly ? t("athletes.deleteOnly") : undefined}
        aria-label={t("athletes.delete", { name })}
      >
        <Trash2 className={ICON} aria-hidden="true" />
      </Button>
    </div>
  );
}
