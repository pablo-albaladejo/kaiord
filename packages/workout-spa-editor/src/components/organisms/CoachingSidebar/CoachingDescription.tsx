/**
 * Renders a coaching description as paragraphs with optional bold
 * emphasis. The formatter is in `format-coaching-description.ts`; this
 * component only walks the parsed AST → React. Avoids
 * `dangerouslySetInnerHTML` so the sidebar is safe even if the
 * upstream description carries unexpected markup.
 */
import { formatCoachingDescription } from "./format-coaching-description";

export type CoachingDescriptionProps = {
  description: string | null;
};

export function CoachingDescription({ description }: CoachingDescriptionProps) {
  if (!description) {
    return (
      <p
        data-testid="coaching-sidebar-empty"
        className="text-xs italic text-slate-500 dark:text-slate-400"
      >
        No description provided.
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
          {p.inlines.map((inline, ii) =>
            inline.kind === "strong" ? (
              <strong key={ii}>{inline.value}</strong>
            ) : (
              <span key={ii}>{inline.value}</span>
            )
          )}
        </p>
      ))}
    </div>
  );
}
