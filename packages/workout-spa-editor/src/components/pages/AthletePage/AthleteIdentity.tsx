import { useState } from "react";

import type { Profile } from "../../../types/profile";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { AvatarRing } from "../../molecules/AvatarRing";
import { deriveInitials, deriveTagline } from "./athlete-identity-helpers";
import { ProfileEditDialog } from "./ProfileEditDialog";

const AVATAR_SIZE = 56;

type AthleteIdentityProps = {
  profile: Profile;
};

export function AthleteIdentity({ profile }: AthleteIdentityProps) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-center gap-3.5">
      <AvatarRing initials={deriveInitials(profile.name)} size={AVATAR_SIZE} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[21px] font-bold text-slate-50">
          {profile.name}
        </div>
        <div className="text-[13.5px] text-slate-400">
          {deriveTagline(profile)}
        </div>
      </div>
      <button
        type="button"
        aria-label="Edit profile"
        onClick={() => setEditing(true)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-white/5 text-slate-300"
      >
        <Icon
          icon={ICON_MAP.edit}
          size="sm"
          color="inherit"
          strokeWidth={1.9}
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
