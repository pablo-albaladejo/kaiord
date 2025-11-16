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
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      loading={isLoading}
      variant="primary"
      size="md"
    >
      {isLoading ? "Loading..." : "Upload Workout File"}
    </Button>
  );
}
