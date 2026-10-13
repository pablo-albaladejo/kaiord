import { useTranslate } from "../../../i18n/use-translate";
import type { Profile } from "../../../types/profile";
import { SectionHead } from "../../molecules/SectionHead";
import { AthleteRow } from "./AthleteRow";

type AthletesListProps = {
  profiles: ReadonlyArray<Profile>;
  activeId: string | null;
  onExport: (profile: Profile) => void;
  onDelete: (profileId: string) => void;
};

export function AthletesList({
  profiles,
  activeId,
  onExport,
  onDelete,
}: AthletesListProps) {
  const t = useTranslate("athlete");
  return (
    <section>
      <SectionHead title={t("athletes.list", { count: profiles.length })} />
      <ul className="m-0 list-none space-y-2 p-0">
        {profiles.map((profile) => (
          <AthleteRow
            key={profile.id}
            profile={profile}
            isActive={profile.id === activeId}
            isOnly={profiles.length === 1}
            onExport={onExport}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </section>
  );
}
