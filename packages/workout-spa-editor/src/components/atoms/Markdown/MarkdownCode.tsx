import { useTranslate } from "../../../i18n/use-translate";

/** A fenced block keeps its own whitespace and scrolls sideways in place; the
 * region is focusable and named so the keyboard and screen readers reach it. */
export function MarkdownCode({ text }: { text: string }) {
  const t = useTranslate("common");
  return (
    <pre
      role="region"
      aria-label={t("markdown.code")}
      tabIndex={0}
      className="overflow-x-auto whitespace-pre rounded-lg bg-surface-deep p-2 font-mono text-[12.5px]"
    >
      <code>{text}</code>
    </pre>
  );
}
