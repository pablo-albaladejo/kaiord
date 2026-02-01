/**
 * FAQSection Component
 *
 * Frequently asked questions.
 */

import { HelpCircle } from "lucide-react";
import { FAQItem } from "../components/FAQItem";

export function FAQSection() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <HelpCircle className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-4">
        <FAQItem
          question="What file formats are supported?"
          answer="The editor supports KRD (native format), FIT (Garmin), TCX (Training Center XML), and ZWO (Zwift) formats for both import and export."
        />

        <FAQItem
          question="How do I create a repetition block?"
          answer="Select multiple steps by clicking while holding Shift or Ctrl, then press Ctrl+G (Cmd+G on Mac) or click the 'Create Block' button. You can also drag steps into an existing block."
        />

        <FAQItem
          question="Can I use this offline?"
          answer="Yes! The editor works offline once loaded. Your workouts are saved in your browser's local storage and will be available even without an internet connection."
        />

        <FAQItem
          question="What are training zones?"
          answer="Training zones are intensity ranges based on your FTP (power) or maximum heart rate. Configure your zones in the Profile Manager to see zone-based targets in your workouts."
        />

        <FAQItem
          question="How do I export my workout?"
          answer="Click the 'Save' button and select your desired export format (KRD, FIT, TCX, or ZWO). The file will be downloaded to your device."
        />

        <FAQItem
          question="Can I undo changes?"
          answer="Yes! Use Ctrl+Z (Cmd+Z on Mac) to undo and Ctrl+Y (Cmd+Y on Mac) to redo. The editor maintains a full history of your changes."
        />

        <FAQItem
          question="What's the difference between duration types?"
          answer="Time-based durations use minutes/seconds, distance-based use meters/kilometers, and open durations continue until you manually advance (lap button press)."
        />

        <FAQItem
          question="How do I save workouts to my library?"
          answer="Click the 'Save to Library' button to store your workout locally. You can add tags and notes for easy organization and retrieval."
        />
      </div>
    </div>
  );
}
