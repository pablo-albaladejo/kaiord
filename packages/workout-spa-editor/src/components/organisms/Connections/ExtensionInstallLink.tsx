import { useTranslate } from "../../../i18n/use-translate";
import { BRIDGE_DOCS_URL } from "../../molecules/CalendarEmptyStates/first-run-steps";

/** The one install destination the onboarding step already uses. */
export function ExtensionInstallLink() {
  const t = useTranslate("connections");
  return (
    <a
      href={BRIDGE_DOCS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-ink-strong underline underline-offset-2"
    >
      {t("ext.install")}
    </a>
  );
}
