/**
 * Tutorial Steps Configuration
 *
 * Defines the onboarding tutorial steps shown to first-time users.
 *
 * Requirements:
 * - Requirement 37.1: Display onboarding tutorial on first visit
 */

import type { TutorialStep } from "../components/organisms/OnboardingTutorial/OnboardingTutorial";

export const TUTORIAL_STEPS: Array<TutorialStep> = [
  {
    title: "Welcome to Workout Editor",
    description:
      "This tutorial will guide you through the key features of the Workout Editor. You can skip at any time or replay this tutorial from the Help section.",
    position: "center",
  },
  {
    title: "Create or Load Workouts",
    description:
      "Start by creating a new workout or loading an existing one. Supported formats include KRD, FIT, TCX, and ZWO.",
    position: "center",
  },
  {
    title: "Add Workout Steps",
    description:
      "Build your workout by adding steps with specific durations and target intensities. Each step can be customized for time, distance, or open duration.",
    position: "center",
  },
  {
    title: "Organize with Drag & Drop",
    description:
      "Reorder steps by dragging them, or use keyboard shortcuts (Alt+Up/Down) for quick adjustments.",
    position: "center",
  },
  {
    title: "Create Repetition Blocks",
    description:
      "Group multiple steps into repetition blocks to create interval workouts. Select steps and press Ctrl+G (Cmd+G on Mac).",
    position: "center",
  },
  {
    title: "Save Your Work",
    description:
      "Save your workout using Ctrl+S (Cmd+S on Mac) or the Save button. You can also save to your library for quick access later.",
    position: "center",
  },
];
