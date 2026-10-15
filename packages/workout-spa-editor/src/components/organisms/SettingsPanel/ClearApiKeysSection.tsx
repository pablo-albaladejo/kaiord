import { clearAllProviders } from "../../../application/ai/clear-all-providers";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";

const SECURE_STORAGE_PREFIX = "kaiord_secure_";

const clearSecureStorage = (): void => {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(SECURE_STORAGE_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
};

export const ClearApiKeysSection: React.FC = () => {
  const t = useTranslate("settings");
  const persistence = usePersistence();
  const toast = useToastContext();

  const handleClearAll = async () => {
    try {
      await clearAllProviders(persistence);
      clearSecureStorage();
    } catch {
      toast.error(t("privacy.clearKeysFailed"));
    }
  };

  return (
    <div>
      <Button variant="danger" size="sm" onClick={handleClearAll}>
        {t("privacy.clearAllApiKeys")}
      </Button>
      <p className="mt-2 text-xs text-ink-muted">{t("privacy.clearAllHint")}</p>
    </div>
  );
};
