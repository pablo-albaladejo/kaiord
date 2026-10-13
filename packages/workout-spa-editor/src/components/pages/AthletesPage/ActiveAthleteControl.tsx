import { useEffect, useRef } from "react";
import { Link } from "wouter";

import { useProfileSwitch } from "../../../hooks/use-profile-switch";
import { useTranslate } from "../../../i18n/use-translate";
import type { Profile } from "../../../types/profile";
import { Button } from "../../atoms/Button";

type ActiveAthleteControlProps = {
  profile: Profile;
  isActive: boolean;
  onSwitched: (message: string) => void;
};

const LINK_CLASS =
  "text-[13px] font-medium text-ink-strong underline underline-offset-2";

/* "Make active" for the others, a link to the body and zones for the
   active one. Making one active unmounts the button the user pressed, so
   the focus follows to the link that replaces it. */
export function ActiveAthleteControl({
  profile,
  isActive,
  onSwitched,
}: ActiveAthleteControlProps) {
  const t = useTranslate("athlete");
  const link = useRef<HTMLAnchorElement>(null);
  const switching = useRef(false);
  const { handleSwitchProfile } = useProfileSwitch({
    profiles: [profile],
    onSwitched,
  });

  useEffect(() => {
    if (!isActive || !switching.current) return;
    switching.current = false;
    link.current?.focus();
  }, [isActive]);

  if (isActive) {
    return (
      <Link ref={link} href="/athlete" className={LINK_CLASS}>
        {t("athletes.editDetails")}
      </Link>
    );
  }
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        switching.current = true;
        handleSwitchProfile(profile.id);
      }}
      aria-label={t("athletes.setActiveFor", { name: profile.name })}
    >
      {t("athletes.setActive")}
    </Button>
  );
}
