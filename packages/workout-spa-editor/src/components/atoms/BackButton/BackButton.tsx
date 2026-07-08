import { ArrowLeft } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";

export type BackButtonProps = {
  readonly onClick: () => void;
  readonly testId?: string;
};

export function BackButton({ onClick, testId }: BackButtonProps) {
  const t = useTranslate("common");
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("actions.back")}
      data-testid={testId ?? "back-button"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      <ArrowLeft className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
