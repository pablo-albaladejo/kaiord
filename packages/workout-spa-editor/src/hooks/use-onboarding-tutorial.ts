/**
 * Onboarding Tutorial Hook
 *
 * Manages the onboarding tutorial state, including auto-show
 * on first visit and E2E testing detection.
 *
 * Requirements:
 * - Requirement 37.1: Display onboarding tutorial on first visit
 * - Requirement 37.5: Allow skipping or replaying tutorial
 */

import { useEffect, useState } from "react";
import { hasCompletedOnboarding } from "../components/organisms/OnboardingTutorial/OnboardingTutorial";

const isE2ETestingEnvironment = (): boolean => {
  return (
    window.location.search.includes("e2e=true") ||
    window.location.search.includes("skipTutorial=true") ||
    // @ts-expect-error - Playwright sets this property during tests
    window.__PLAYWRIGHT__ === true
  );
};

export const useOnboardingTutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (isE2ETestingEnvironment()) {
      return;
    }

    if (!hasCompletedOnboarding()) {
      setShowTutorial(true);
    }
  }, []);

  return { showTutorial, setShowTutorial };
};
