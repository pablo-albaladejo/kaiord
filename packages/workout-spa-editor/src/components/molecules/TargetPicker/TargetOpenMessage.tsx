import { useTranslate } from "../../../i18n/use-translate";

type TargetOpenMessageProps = {
  error?: string;
};

export const TargetOpenMessage = ({ error }: TargetOpenMessageProps) => {
  const t = useTranslate("targets");

  return (
    <>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t("openMessage")}
      </p>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </>
  );
};
