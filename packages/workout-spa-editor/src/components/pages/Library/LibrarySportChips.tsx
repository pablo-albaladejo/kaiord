import { Pill } from "../../atoms/Pill";
import { SPORT_CHIPS, type SportFilter } from "./library-filter";

export type LibrarySportChipsProps = {
  active: SportFilter;
  onChange: (value: SportFilter) => void;
};

export function LibrarySportChips({
  active,
  onChange,
}: LibrarySportChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {SPORT_CHIPS.map((chip) => (
        <button
          key={chip.value}
          type="button"
          onClick={() => onChange(chip.value)}
          aria-pressed={active === chip.value}
          className="shrink-0"
        >
          <Pill tone={active === chip.value ? "accentSolid" : "neutral"}>
            {chip.label}
          </Pill>
        </button>
      ))}
    </div>
  );
}
