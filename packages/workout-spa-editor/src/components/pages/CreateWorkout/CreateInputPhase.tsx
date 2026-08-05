import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import type { ActiveSport } from "../../../lib/athlete";
import { ATHLETE_SPORTS } from "../../../lib/athlete";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { Profile } from "../../../types/profile";
import { Segmented } from "../../atoms/Segmented";
import { CreateInputHero } from "./CreateInputHero";
import { CreateProvidersEmpty } from "./CreateProvidersEmpty";
import { CreateSheetHeader } from "./CreateSheetHeader";
import { CreateStartFrom } from "./CreateStartFrom";

export type CreateInputPhaseProps = {
  sport: ActiveSport;
  onSportChange: (sport: ActiveSport) => void;
  profile: Profile | null;
  promptText: string;
  onPromptChange: (value: string) => void;
  provider: LlmProviderConfig | null;
  onGenerate: () => void;
  onClose: () => void;
};

const SPORT_OPTIONS = ATHLETE_SPORTS.map((s) => ({
  value: s.value,
  label: s.label,
  icon: s.icon,
}));

export function CreateInputPhase({
  sport,
  onSportChange,
  profile,
  promptText,
  onPromptChange,
  provider,
  onGenerate,
  onClose,
}: CreateInputPhaseProps) {
  const t = useTranslate("create-workout");
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col gap-4">
      <CreateSheetHeader title={t("sheet.newSession")} onClose={onClose} />
      <Segmented
        options={SPORT_OPTIONS}
        value={sport}
        onChange={onSportChange}
        ariaLabel={t("sport")}
      />
      {provider ? (
        <CreateInputHero
          sport={sport}
          profile={profile}
          promptText={promptText}
          onPromptChange={onPromptChange}
          onGenerate={onGenerate}
        />
      ) : (
        <CreateProvidersEmpty />
      )}
      <CreateStartFrom
        onTemplate={() => {
          onClose();
          navigate("/library");
        }}
        onBlank={() => navigate("/workout/new?source=scratch")}
        onImport={() => navigate("/workout/new?action=import")}
      />
    </div>
  );
}
