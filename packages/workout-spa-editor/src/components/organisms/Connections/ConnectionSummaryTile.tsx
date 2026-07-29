type Props = {
  testId: string;
  label: string;
  /** The headline number, or the placeholder while nothing is known yet. */
  value: string;
  /** The unit or qualifier the number is meaningless without. */
  note?: string;
  tone?: "plain" | "good" | "warn";
};

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  plain: "text-ink-strong",
  good: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
};

export function ConnectionSummaryTile({
  testId,
  label,
  value,
  note,
  tone = "plain",
}: Props) {
  return (
    <div
      data-testid={testId}
      className="flex flex-col gap-1.5 rounded-2xl border border-edge bg-surface p-4"
    >
      <span className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
        {label}
      </span>
      <span className="flex flex-wrap items-baseline gap-x-1.5">
        <span className={`text-2xl font-extrabold ${TONE[tone]}`}>{value}</span>
        {note !== undefined && (
          <span className="text-[12.5px] text-ink-muted">{note}</span>
        )}
      </span>
    </div>
  );
}
