import { useTranslate } from "../../../i18n/use-translate";
import type { KeySaveOutcome } from "./save-with-key-check";

export type KeyCheckStatus = "idle" | "checking" | KeySaveOutcome;

/** What the key check said, next to the button that started it. */
export function KeyCheckMessage({ status }: { status: KeyCheckStatus }) {
  const t = useTranslate("settings");
  if (status === "invalid")
    return (
      <p role="alert" className="m-0 text-sm text-danger-text">
        {t("providers.keyInvalid")}
      </p>
    );
  if (status === "checking" || status === "unverified")
    return (
      <p role="status" className="m-0 text-sm text-ink-muted">
        {t(
          status === "checking"
            ? "providers.checking"
            : "providers.keyUnverified"
        )}
      </p>
    );
  return null;
}
