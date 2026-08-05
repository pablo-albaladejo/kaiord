import { AttentionMark } from "../../atoms/AttentionMark";

type Props = {
  testId: string;
  label: string;
  /** The headline number, or the placeholder while nothing is known yet. */
  value: string;
  /** The unit or qualifier the number is meaningless without. */
  note?: string;
  /** Marks the one tile whose number is asking for something. */
  marked?: boolean;
};

export function ConnectionSummaryTile({
  testId,
  label,
  value,
  note,
  marked = false,
}: Props) {
  return (
    <div
      data-testid={testId}
      className="flex flex-col gap-1.5 rounded-2xl border border-edge-soft bg-surface p-4"
    >
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
        {marked && <AttentionMark size="xs" />}
        {label}
      </span>
      <span className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-2xl font-semibold text-ink-strong">{value}</span>
        {note !== undefined && (
          <span className="text-[12.5px] text-ink-muted">{note}</span>
        )}
      </span>
    </div>
  );
}
