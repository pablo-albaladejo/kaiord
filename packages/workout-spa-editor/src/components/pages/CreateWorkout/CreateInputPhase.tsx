import { useLocation, useSearch } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import type { ActiveSport } from "../../../lib/athlete";
import { athleteSportOptions } from "../../../lib/athlete";
import {
  buildNewSessionHref,
  type NewSessionContext,
} from "../../../routing/new-session-href";
import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { useClearWorkout } from "../../../store/selectors/workout-selectors";
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

const sheetContext = (search: string): NewSessionContext => {
  const params = new URLSearchParams(search);
  return {
    date: params.get("date"),
    week: params.get("week"),
    from: params.get("from"),
  };
};

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
  const sportOptions = athleteSportOptions(useTranslate("athlete"));
  const [, navigate] = useLocation();
  const context = { ...sheetContext(useSearch()), sport };
  const clearWorkout = useClearWorkout();
  const startFrom = (
    <CreateStartFrom
      lead={!provider}
      onTemplate={() => navigate(buildNewSessionHref("template", context))}
      onBlank={() => {
        // "Blank" means blank: a draft left in the store would otherwise
        // be reopened and the scratch seed (and its sport) skipped.
        clearWorkout();
        navigate(buildNewSessionHref("blank", context));
      }}
      onImport={() => navigate(buildNewSessionHref("import", context))}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <CreateSheetHeader title={t("sheet.newSession")} onClose={onClose} />
      <Segmented
        options={sportOptions}
        value={sport}
        onChange={onSportChange}
        ariaLabel={t("sport")}
      />
      {provider ? (
        <>
          <CreateInputHero
            sport={sport}
            profile={profile}
            promptText={promptText}
            onPromptChange={onPromptChange}
            onGenerate={onGenerate}
          />
          {startFrom}
        </>
      ) : (
        // Without a provider the AI block is only a setup prompt, so the
        // paths that work right now come first and stay above the fold.
        <>
          {startFrom}
          <CreateProvidersEmpty />
        </>
      )}
    </div>
  );
}
