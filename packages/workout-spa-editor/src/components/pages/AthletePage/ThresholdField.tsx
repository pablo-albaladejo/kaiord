import { type ChangeEvent, type KeyboardEvent, useState } from "react";

import type {
  ParsedThreshold,
  ThresholdProvenance,
} from "../../../lib/athlete";
import { Input } from "../../atoms/Input/Input";
import { ThresholdProvenanceLine } from "./ThresholdProvenanceLine";

type ThresholdFieldProps = {
  label: string;
  /** The stored value as text, in the active units. */
  shown: string;
  parse: (raw: string) => ParsedThreshold;
  /** Called with a valid value, or `undefined` when the field is cleared. */
  onSave: (value: number | undefined) => void;
  invalidMessage: string;
  placeholder: string;
  numeric: boolean;
  hint?: string;
  provenance?: ThresholdProvenance;
};

/**
 * One threshold, edited in place. Typing "185" passes through 1 and 18, so
 * the value is read and saved on blur or Enter only. The typed text stays
 * until the stored value reflects it, so the field does not flash back.
 */
export function ThresholdField(props: ThresholdFieldProps) {
  const { label, shown, parse, onSave, provenance } = props;
  const [raw, setRaw] = useState<string | null>(null);
  const [committed, setCommitted] = useState<string | null>(null);
  const [prevShown, setPrevShown] = useState(shown);
  const [invalid, setInvalid] = useState(false);

  // A new stored value replaces the text only once our own save has landed
  // (or nothing was typed); an edit still in progress is the athlete's.
  if (shown !== prevShown) {
    setPrevShown(shown);
    if (raw === committed) {
      setRaw(null);
      setCommitted(null);
    }
  }

  // Enter and the blur that follows must not save the same value twice.
  const commit = () => {
    if (raw === null || raw === committed) return;
    if (raw === shown) {
      setInvalid(false);
      return;
    }
    const value = parse(raw);
    setInvalid(value === null);
    if (value === null) return;
    setCommitted(raw);
    onSave(value);
  };

  return (
    <div className="flex min-w-0 flex-col gap-[5px]">
      <Input
        label={label}
        variant={props.numeric ? "number" : "text"}
        inputMode={props.numeric ? "numeric" : "text"}
        value={raw ?? shown}
        helperText={props.hint}
        error={invalid ? props.invalidMessage : undefined}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setRaw(e.target.value)}
        onBlur={commit}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") commit();
        }}
        placeholder={props.placeholder}
      />
      {provenance && shown !== "" && (
        <ThresholdProvenanceLine provenance={provenance} />
      )}
    </div>
  );
}
