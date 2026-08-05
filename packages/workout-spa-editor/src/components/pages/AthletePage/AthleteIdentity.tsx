import { useState } from "react";

import { useUnits } from "../../../contexts/units-context";
import { useTranslate } from "../../../i18n/use-translate";
import type { ActiveSport } from "../../../lib/athlete";
import type { Profile } from "../../../types/profile";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { AvatarRing } from "../../molecules/AvatarRing";
import { deriveInitials, deriveTagline } from "./athlete-identity-helpers";
import { ProfileEditDialog } from "./ProfileEditDialog";

const AVATAR_SIZE = 56;

type AthleteIdentityProps = {
  profile: Profile;
  sport: ActiveSport;
};

export function AthleteIdentity({ profile, sport }: AthleteIdentityProps) {
  const t = useTranslate("athlete");
  const units = useUnits();
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-center gap-3.5">
      <AvatarRing initials={deriveInitials(profile.name)} size={AVATAR_SIZE} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[20px] font-semibold tracking-[-0.024em] text-ink-strong">
          {profile.name}
        </div>
        <div className="text-[13px] text-ink-muted tabular-nums">
          {deriveTagline(profile, sport, units, t)}
        </div>
      </div>
      <button
        type="button"
        aria-label={t("editProfile")}
        onClick={() => setEditing(true)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-edge bg-transparent text-ink-body transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] hover:border-edge-strong hover:text-ink-strong"
      >
        <Icon
          icon={ICON_MAP.edit}
          size="sm"
          color="inherit"
          strokeWidth={2.25}
        />
      </button>
      <ProfileEditDialog
        open={editing}
        profile={profile}
        onClose={() => setEditing(false)}
      />
    </div>
  );
}
