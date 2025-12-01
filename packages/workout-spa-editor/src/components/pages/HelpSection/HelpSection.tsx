/**
 * HelpSection Component
 *
 * Main help and documentation page.
 */

import { resetOnboarding } from "../../organisms/OnboardingTutorial/OnboardingTutorial";
import { HelpHeader } from "./components/HelpHeader";
import { ExamplesSection } from "./sections/ExamplesSection";
import { FAQSection } from "./sections/FAQSection";
import { GettingStartedSection } from "./sections/GettingStartedSection";
import { KeyboardShortcutsSection } from "./sections/KeyboardShortcutsSection";

type HelpSectionProps = {
  onReplayTutorial?: () => void;
};

export function HelpSection({ onReplayTutorial }: HelpSectionProps) {
  const handleReplayTutorial = () => {
    resetOnboarding();
    onReplayTutorial?.();
  };

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
