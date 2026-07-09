import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";

type FileUploadButtonProps = {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
};

export function FileUploadButton({
  onClick,
  disabled,
  isLoading,
}: FileUploadButtonProps) {
  const t = useTranslate("import");
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      loading={isLoading}
      variant="primary"
      size="md"
    >
      {isLoading ? t("button.loading") : t("button.upload")}
    </Button>
  );
}
