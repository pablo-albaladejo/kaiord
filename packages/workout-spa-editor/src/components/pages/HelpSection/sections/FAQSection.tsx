/**
 * FAQSection Component
 *
 * Frequently asked questions.
 */

import { HelpCircle } from "lucide-react";

import { useTranslate } from "../../../../i18n/use-translate";
import { FAQItem } from "../components/FAQItem";

const FAQ_KEYS = [
  "formats",
  "block",
  "offline",
  "zones",
  "export",
  "undo",
  "durations",
  "library",
];

export function FAQSection() {
  const t = useTranslate("help");
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <HelpCircle className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("faq.heading")}
        </h2>
      </div>

      <div className="space-y-4">
        {FAQ_KEYS.map((key) => (
          <FAQItem
            key={key}
            question={t(`faq.${key}.q`)}
            answer={t(`faq.${key}.a`)}
          />
        ))}
      </div>
    </div>
  );
}
