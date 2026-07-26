/**
 * Renders a coaching description as paragraphs with optional bold
 * emphasis and safe links. The formatter is in
 * `format-coaching-description.ts`; this component only walks the
 * parsed AST → React via the shared inline renderer. Avoids
 * `dangerouslySetInnerHTML` so the sidebar is safe even if the
 * upstream description carries unexpected markup.
 */
import { useTranslate } from "../../../i18n/use-translate";
import { renderCoachingInline } from "./coaching-inline";
import { formatCoachingDescription } from "./format-coaching-description";

export type CoachingDescriptionProps = {
  description: string | null;
};

export function CoachingDescription({ description }: CoachingDescriptionProps) {
  const t = useTranslate("chat");
  if (!description) {
    return (
      <p
        data-testid="coaching-sidebar-empty"
        className="text-xs italic text-slate-500 dark:text-slate-400"
      >
        {t("coaching.noDescription")}
      </p>
    );
  }
  const paragraphs = formatCoachingDescription(description);
  return (
    <div
      data-testid="coaching-sidebar-description"
      className="space-y-2 leading-relaxed"
    >
      {paragraphs.map((p, pi) => (
        <p key={pi}>
          {p.inlines.map((inline, ii) => renderCoachingInline(inline, ii))}
        </p>
      ))}
    </div>
  );
}
