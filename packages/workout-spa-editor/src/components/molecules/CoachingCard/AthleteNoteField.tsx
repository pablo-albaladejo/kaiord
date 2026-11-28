/**
 * "Your note" ("Tu nota"): the Athlete note, shown next to the coach's text.
 * The assistant reads it with that text, which is never changed; it is kept
 * with the athlete's data and never sent to Train2Go.
 */
import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { OUTLINE_BUTTON } from "./matched-action-button";
import { useAthleteNote } from "./use-athlete-note";

const INPUT_ID = "coaching-athlete-note";
const BUTTON = `${OUTLINE_BUTTON} text-xs`;

export type AthleteNoteFieldProps = {
  profileId: string | null;
  /** The view-model activity id (`${source}:${sourceId}`). */
  activityId: string;
};

export function AthleteNoteField({
  profileId,
  activityId,
}: AthleteNoteFieldProps) {
  const t = useTranslate("coaching");
  const { stored = "", save } = useAthleteNote(profileId, activityId);
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? stored;
  const changed = value.trim() !== stored;
  return (
    <div
      data-testid="athlete-note"
      className="space-y-1 border-t border-edge pt-3"
    >
      <label
        htmlFor={INPUT_ID}
        className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400"
      >
        {t("athleteNote.label")}
      </label>
      <textarea
        id={INPUT_ID}
        data-testid="athlete-note-input"
        rows={2}
        value={value}
        placeholder={t("athleteNote.placeholder")}
        onChange={(event) => setDraft(event.target.value)}
        className="w-full rounded-md border border-edge bg-transparent p-2 text-sm"
      />
      <p className="text-xs text-muted-foreground">{t("athleteNote.hint")}</p>
      <div className="flex justify-end gap-2">
        {stored ? (
          <button
            type="button"
            data-testid="athlete-note-clear"
            className={BUTTON}
            onClick={() => {
              setDraft("");
              void save("");
            }}
          >
            {t("athleteNote.clear")}
          </button>
        ) : null}
        <button
          type="button"
          data-testid="athlete-note-save"
          className={BUTTON}
          disabled={!changed}
          onClick={() => void save(value)}
        >
          {t("athleteNote.save")}
        </button>
      </div>
    </div>
  );
}
