import { useRef, useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { Input } from "../../atoms/Input/Input";

const MAX_HEART_RATE = 250;

const isValid = (value: number): boolean =>
  Number.isInteger(value) && value > 0 && value <= MAX_HEART_RATE;

type MaxHeartRateFieldProps = {
  initial: number | undefined;
  /** Called with a valid value, or `undefined` when the field is cleared. */
  onSave: (value: number | undefined) => void;
};

/** `profile.maxHeartRate` is a cross-sport ceiling, so it is not a threshold. */
export function MaxHeartRateField({ initial, onSave }: MaxHeartRateFieldProps) {
  const t = useTranslate("athlete");
  const [raw, setRaw] = useState(initial?.toString() ?? "");
  const [invalid, setInvalid] = useState(false);
  const lastSaved = useRef(initial?.toString() ?? "");

  // Typing "185" passes through 1 and 18, which are in range but are not the
  // answer, so the value is validated and saved on blur or Enter only.
  const commit = () => {
    const value = Number(raw);
    if (raw !== "" && !isValid(value)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    if (raw === lastSaved.current) return;
    lastSaved.current = raw;
    onSave(raw === "" ? undefined : value);
  };

  return (
    <Input
      label={t("body.maxHeartRate")}
      variant="number"
      value={raw}
      error={invalid ? t("body.maxHeartRateRange") : undefined}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
      }}
      placeholder="190"
    />
  );
}
