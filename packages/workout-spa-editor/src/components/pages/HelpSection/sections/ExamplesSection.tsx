/**
 * ExamplesSection Component
 *
 * Example workouts showcase.
 */

import { FileText } from "lucide-react";

import { useTranslate } from "../../../../i18n/use-translate";
import { ExampleWorkout } from "../components/ExampleWorkout";

const EXAMPLE_KEYS = ["sweetSpot", "tempo", "swim"];
const STEP_KEYS = ["step1", "step2", "step3"];

export function ExamplesSection() {
  const t = useTranslate("help");
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("examples.heading")}
        </h2>
      </div>

      <div className="space-y-4">
        {EXAMPLE_KEYS.map((key) => (
          <ExampleWorkout
            key={key}
            title={t(`examples.${key}.title`)}
            sport={t(`examples.${key}.sport`)}
            description={t(`examples.${key}.description`)}
            steps={STEP_KEYS.map((step) => t(`examples.${key}.${step}`))}
          />
        ))}
      </div>
    </div>
  );
}
