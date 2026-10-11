import { useToastContext } from "../contexts/ToastContext";
import { useTranslate } from "../i18n/use-translate";

/**
 * Handler for `FileUpload`'s `onWarnings`: a lossy import (a step the reader
 * skipped, a target it could not map) still loads, so the user is told the
 * workout differs from the file rather than finding out on the bike.
 */
export function useImportWarningsToast() {
  const t = useTranslate("import");
  const toast = useToastContext();
  return () => toast.warning(t("warnings.title"), t("warnings.description"));
}
