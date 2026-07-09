import { useTranslate } from "../../../i18n/use-translate";

export function PrivacyInformationSection() {
  const t = useTranslate("settings");
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        {t("privacy.information")}
      </h3>
      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <li>{t("privacy.infoNoServer")}</li>
        <li>{t("privacy.infoGarmin")}</li>
        <li>{t("privacy.infoTrain2go")}</li>
        <li>{t("privacy.infoLlmKeys")}</li>
        <li>{t("privacy.infoNotResponsible")}</li>
      </ul>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        <a
          href="https://kaiord.com/docs/legal/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {t("privacy.privacyPolicyLink")}
        </a>
      </p>
    </section>
  );
}
