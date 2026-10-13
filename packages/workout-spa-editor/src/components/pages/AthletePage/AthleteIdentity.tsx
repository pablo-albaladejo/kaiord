import { useUnits } from "../../../contexts/units-context";
import { useCurrentWeightKg } from "../../../hooks/health/use-current-weight";
import { useRenameAthlete } from "../../../hooks/use-rename-athlete";
import { useTranslate } from "../../../i18n/use-translate";
import type { ActiveSport } from "../../../lib/athlete";
import type { Profile } from "../../../types/profile";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { AvatarRing } from "../../molecules/AvatarRing";
import { InlineNameEdit } from "../../molecules/InlineNameEdit";
import { useInlineRename } from "../../molecules/InlineNameEdit/use-inline-rename";
import { deriveInitials, deriveTagline } from "./athlete-identity-helpers";

const AVATAR_SIZE = 56;

type AthleteIdentityProps = {
  profile: Profile;
  sport: ActiveSport;
};

/* The athlete's name is edited here, in place (§5.2 Identity): the pencil
   swaps the name for a field. */
export function AthleteIdentity({ profile, sport }: AthleteIdentityProps) {
  const t = useTranslate("athlete");
  const units = useUnits();
  const rename = useRenameAthlete();
  const { renaming, pencilRef, start, done } = useInlineRename();
  const currentWeightKg = useCurrentWeightKg(profile.id, profile);

  return (
    <div className="flex items-center gap-3.5" data-testid="athlete-identity">
      <AvatarRing initials={deriveInitials(profile.name)} size={AVATAR_SIZE} />
      {renaming ? (
        <InlineNameEdit
          value={profile.name}
          label={t("nameLabel")}
          onSave={(name) => rename(profile.id, name)}
          onDone={done}
        />
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[20px] font-semibold tracking-[-0.024em] text-ink-strong">
              {profile.name}
            </div>
            <div className="text-[13px] text-ink-muted tabular-nums">
              {deriveTagline(profile, sport, units, t, currentWeightKg)}
            </div>
          </div>
          <button
            ref={pencilRef}
            type="button"
            aria-label={t("rename")}
            onClick={start}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-edge bg-transparent text-ink-body transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] hover:border-edge-strong hover:text-ink-strong"
          >
            <Icon
              icon={ICON_MAP.edit}
              size="sm"
              color="inherit"
              strokeWidth={2.25}
            />
          </button>
        </>
      )}
    </div>
  );
}
