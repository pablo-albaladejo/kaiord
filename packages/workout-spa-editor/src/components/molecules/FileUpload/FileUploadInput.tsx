import type { RefObject } from "react";

type FileUploadInputProps = {
  fileInputRef: RefObject<HTMLInputElement>;
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
  return (
    <input
      ref={fileInputRef}
      type="file"
      accept={accept}
      onChange={(e) => onFileChange(e.target.files?.[0])}
      className="hidden"
      disabled={disabled || isLoading}
      aria-label="Upload workout file"
    />
  );
}
