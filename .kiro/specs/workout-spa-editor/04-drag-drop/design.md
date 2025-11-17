# Design Document - Drag-and-Drop Reordering

## Overview

Implement drag-and-drop reordering using @dnd-kit library for accessible, touch-friendly step reordering.

## Technology

- **Library:** @dnd-kit/core + @dnd-kit/sortable
- **Features:** Mouse, touch, and keyboard support
- **Accessibility:** Screen reader announcements

## Component Updates

### StepCard (Draggable)

```typescript
import { useSortable } from '@dnd-kit/sortable';

const StepCard = ({ step, id }: StepCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  return (
    <div ref={setNodeRef} style={{ transform, transition }} {...attributes} {...listeners}>
      {/* Step content */}
    </div>
  );
};
```

### StepEditor (Drop Context)

```typescript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const StepEditor = ({ steps }: StepEditorProps) => {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      reorderSteps(active.id, over.id);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={steps} strategy={verticalListSortingStrategy}>
        {steps.map(step => <StepCard key={step.id} step={step} />)}
      </SortableContext>
    </DndContext>
  );
};
```

## Keyboard Shortcuts

```typescript
// Alt+Up/Down for reordering
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.altKey && selectedStepId) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveStepUp(selectedStepId);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveStepDown(selectedStepId);
      }
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [selectedStepId]);
```
