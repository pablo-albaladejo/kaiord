import { isRepetitionBlock } from "../../../types/krd";
import { RepetitionBlockCard } from "../../molecules/RepetitionBlockCard/RepetitionBlockCard";
import { StepCard } from "../../molecules/StepCard/StepCard";
import type { RepetitionBlock, WorkoutStep } from "../../../types/krd";

type WorkoutListDragOverlayProps = {
  activeItem: WorkoutStep | RepetitionBlock | null;
};

export const WorkoutListDragOverlay = ({
  activeItem,
}: WorkoutListDragOverlayProps) => {
  if (!activeItem) {
    return null;
  }

  if (isRepetitionBlock(activeItem)) {
    return (
      <div style={{ opacity: 0.5 }}>
        <RepetitionBlockCard
          block={activeItem}
          selectedStepIndex={undefined}
          isDragging={true}
        />
      </div>
    );
  }

  return (
    <div style={{ opacity: 0.5 }}>
      <StepCard
        step={activeItem}
        visualIndex={activeItem.stepIndex}
        isSelected={false}
        isDragging={true}
      />
    </div>
  );
};
