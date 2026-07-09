/**
 * HelpHeader Component
 *
 * Header section for help page.
 */

import { Play } from "lucide-react";

import { useTranslate } from "../../../../i18n/use-translate";
import { Button } from "../../../atoms/Button/Button";

type HelpHeaderProps = {
  onReplayTutorial?: () => void;
};

export function HelpHeader({ onReplayTutorial }: HelpHeaderProps) {
  const t = useTranslate("help");
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            {t("header.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("header.subtitle")}
          </p>
        </div>
        {onReplayTutorial && (
          <Button
            variant="secondary"
            onClick={onReplayTutorial}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {t("header.replayTutorial")}
          </Button>
        )}
      </div>
    </div>
  );
}
