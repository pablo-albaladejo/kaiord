/**
 * HelpSection Component
 *
 * Main help and documentation page.
 */

import { HelpHeader } from "./components/HelpHeader";
import { ExamplesSection } from "./sections/ExamplesSection";
import { FAQSection } from "./sections/FAQSection";
import { GettingStartedSection } from "./sections/GettingStartedSection";
import { KeyboardShortcutsSection } from "./sections/KeyboardShortcutsSection";
import { resetOnboarding } from "../../organisms/OnboardingTutorial/OnboardingTutorial";

type HelpSectionProps = {
  onReplayTutorial?: () => void;
};

export function HelpSection({ onReplayTutorial }: HelpSectionProps) {
  const handleReplayTutorial = onReplayTutorial
    ? () => {
        resetOnboarding();
        onReplayTutorial();
      }
    : undefined;

  return (
    <div className="space-y-6">
      <HelpHeader onReplayTutorial={handleReplayTutorial} />
      <GettingStartedSection />
      <KeyboardShortcutsSection />
      <ExamplesSection />
      <FAQSection />
    </div>
  );
}
