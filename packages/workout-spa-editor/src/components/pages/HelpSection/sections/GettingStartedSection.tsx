/**
 * GettingStartedSection Component
 *
 * Getting started guide for the workout editor.
 */

import { BookOpen } from "lucide-react";

import { useTranslate } from "../../../../i18n/use-translate";

const CREATING_STEPS = ["step1", "step2", "step3", "step4", "step5", "step6"];
const LOADING_STEPS = ["step1", "step2", "step3", "step4"];
const ORGANIZING_STEPS = ["step1", "step2", "step3", "step4", "step5"];

export function GettingStartedSection() {
  const t = useTranslate("help");
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("gettingStarted.heading")}
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {t("gettingStarted.creating.heading")}
          </h3>
          <ol className="list-decimal space-y-2 pl-5 text-gray-600 dark:text-gray-400">
            {CREATING_STEPS.map((step) => (
              <li key={step}>{t(`gettingStarted.creating.${step}`)}</li>
            ))}
          </ol>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {t("gettingStarted.loading.heading")}
          </h3>
          <ol className="list-decimal space-y-2 pl-5 text-gray-600 dark:text-gray-400">
            {LOADING_STEPS.map((step) => (
              <li key={step}>{t(`gettingStarted.loading.${step}`)}</li>
            ))}
          </ol>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {t("gettingStarted.organizing.heading")}
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-gray-600 dark:text-gray-400">
            {ORGANIZING_STEPS.map((step) => (
              <li key={step}>{t(`gettingStarted.organizing.${step}`)}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
