import type { RefObject } from "react";

import { useTranslate } from "../../../i18n/use-translate";

type FileUploadInputProps = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  accept: string;
  disabled: boolean;
  isLoading: boolean;
  onFileChange: (file: File | undefined) => void;
};

export function FileUploadInput({
  fileInputRef,
  accept,
  disabled,
  isLoading,
  onFileChange,
}: FileUploadInputProps) {
  const t = useTranslate("import");
  return (
    <input
      ref={fileInputRef}
      type="file"
      accept={accept}
      onChange={(e) => onFileChange(e.target.files?.[0])}
      className="hidden"
      disabled={disabled || isLoading}
      aria-label={t("input.ariaLabel")}
      data-testid="file-upload-input"
    />
  );
}
