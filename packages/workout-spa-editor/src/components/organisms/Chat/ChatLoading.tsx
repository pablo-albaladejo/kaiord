import { useTranslate } from "../../../i18n/use-translate";

/** Centered loading placeholder shown while the provider list resolves. */
export function ChatLoading() {
  const t = useTranslate("chat");
  return (
    <div className="flex items-center justify-center p-8 text-slate-400">
      {t("page.loading")}
    </div>
  );
}
