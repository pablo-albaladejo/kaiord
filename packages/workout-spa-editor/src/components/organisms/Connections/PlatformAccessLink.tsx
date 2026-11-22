import { useTranslate } from "../../../i18n/use-translate";

/** The public register of unofficial access per Platform (ADR 0002). */
export const PLATFORM_ACCESS_URL =
  "https://kaiord.com/docs/legal/platform-access";

export function PlatformAccessLink() {
  const t = useTranslate("connections");
  return (
    <p className="text-[12.5px] text-ink-muted">
      <a
        href={PLATFORM_ACCESS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-ink-body"
      >
        {t("platformAccess")}
      </a>
    </p>
  );
}
