import { useTranslate } from "../../../i18n/use-translate";

/** Marks a step note the AI wrote on its own, with no cue from the coach. */
export const AiNoteLabel = () => {
  const t = useTranslate("editor");
  return (
    <span
      title={t("notes.aiTitle")}
      className="mr-1.5 inline-block rounded bg-surface-deep px-1 text-[10px] font-semibold not-italic uppercase tracking-wide text-ink-muted"
    >
      {t("notes.ai")}
    </span>
  );
};
