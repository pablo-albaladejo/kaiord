type Props = {
  testId: string;
  selected: boolean;
  label: string;
  onClick: () => void;
};

const BASE =
  "rounded-lg border px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors";
const ON = "border-transparent bg-accent/15 text-accent";
const OFF = "border-edge bg-surface text-ink-body";

/**
 * The one pressed-state button both routing controls use. `aria-pressed` rather
 * than a checkbox: each button's own label names what it does, and the two
 * controls read as one family so a row cannot look like it has two unrelated
 * kinds of switch.
 */
export const RoutingChoiceButton = ({
  testId,
  selected,
  label,
  onClick,
}: Props) => (
  <button
    type="button"
    aria-pressed={selected}
    data-testid={testId}
    onClick={onClick}
    className={`${BASE} ${selected ? ON : OFF}`}
  >
    {label}
  </button>
);
