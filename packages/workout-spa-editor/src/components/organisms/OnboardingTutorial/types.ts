/**
 * OnboardingTutorial types
 */

export type TutorialStep = {
  title: string;
  description: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
};

export type OnboardingTutorialProps = {
  steps: Array<TutorialStep>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  storageKey?: string;
};
