import { lazy, Suspense, useEffect, useState } from "react";

import { TUTORIAL_STEPS } from "../constants/tutorial-steps";

const OnboardingTutorial = lazy(() =>
  import("./organisms/OnboardingTutorial/OnboardingTutorial").then((m) => ({
    default: m.OnboardingTutorial,
  }))
);

type AppTutorialProps = {
  show: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AppTutorial: React.FC<AppTutorialProps> = ({
  show,
  onOpenChange,
}) => {
  const [mounted, setMounted] = useState(show);
  useEffect(() => {
    if (show) setMounted(true);
  }, [show]);

  return (
    <Suspense fallback={null}>
      {(show || mounted) && (
        <OnboardingTutorial
          steps={TUTORIAL_STEPS}
          open={show}
          onOpenChange={onOpenChange}
        />
      )}
    </Suspense>
  );
};
