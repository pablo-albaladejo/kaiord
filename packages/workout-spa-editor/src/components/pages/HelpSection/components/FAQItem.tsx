/**
 * FAQItem Component
 *
 * Single FAQ question and answer.
 */

type FAQItemProps = {
  question: string;
  answer: string;
};

export function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <div className="border-b border-gray-200 pb-4 last:border-b-0 dark:border-gray-700 kiroween:border-gray-700">
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white kiroween:text-white">
        {question}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 kiroween:text-gray-300">
        {answer}
      </p>
    </div>
  );
}
