import type { Meta, StoryObj } from "@storybook/react";
import type { WorkoutStep } from "../../../types/krd";
import { StepCard } from "./StepCard";

const meta = {
  title: "Molecules/StepCard",
  component: StepCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isSelected: {
      control: "boolean",
      description: "Whether the step is currently selected",
    },
    onSelect: {
      action: "selected",
      description: "Callback when step is selected",
    },
  },
} satisfies Meta<typeof StepCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseStep: WorkoutStep = {
  stepIndex: 0,
  durationType: "time",
  duration: {
    type: "time",
    seconds: 300,
  },
  targetType: "power",
  target: {
    type: "power",
    value: {
      unit: "watts",
      value: 200,
    },
  },
  intensity: "warmup",
};

export const Default: Story = {
  args: {
    step: baseStep,
  },
};

export const Selected: Story = {
  args: {
    step: baseStep,
    isSelected: true,
  },
};

export const WithName: Story = {
  args: {
    step: {
      ...baseStep,
      name: "Warm Up",
    },
  },
};

export const WithNotes: Story = {
  args: {
    step: {
      ...baseStep,
      name: "Warm Up",
      notes: "Easy pace, focus on form and breathing",
    },
  },
};

export const ActiveIntensity: Story = {
  args: {
    step: {
      ...baseStep,
      stepIndex: 1,
      intensity: "active",
      duration: {
        type: "time",
        seconds: 600,
      },
      target: {
        type: "power",
        value: {
          unit: "watts",
          value: 250,
        },
      },
    },
  },
};

export const CooldownIntensity: Story = {
  args: {
    step: {
      ...baseStep,
      stepIndex: 2,
      intensity: "cooldown",
      duration: {
        type: "time",
        seconds: 180,
      },
      target: {
        type: "power",
        value: {
          unit: "watts",
          value: 150,
        },
      },
    },
  },
};

export const RestIntensity: Story = {
  args: {
    step: {
      ...baseStep,
      stepIndex: 3,
      intensity: "rest",
      duration: {
        type: "time",
        seconds: 60,
      },
      targetType: "open",
      target: {
        type: "open",
      },
    },
  },
};

export const HeartRateTarget: Story = {
  args: {
    step: {
      ...baseStep,
      targetType: "heart_rate",
      target: {
        type: "heart_rate",
        value: {
          unit: "bpm",
          value: 150,
        },
      },
    },
  },
};

export const HeartRateZone: Story = {
  args: {
    step: {
      ...baseStep,
      targetType: "heart_rate",
      target: {
        type: "heart_rate",
        value: {
          unit: "zone",
          value: 3,
        },
      },
    },
  },
};

export const PowerZone: Story = {
  args: {
    step: {
      ...baseStep,
      targetType: "power",
      target: {
        type: "power",
        value: {
          unit: "zone",
          value: 4,
        },
      },
    },
  },
};

export const FTPPercentage: Story = {
  args: {
    step: {
      ...baseStep,
      targetType: "power",
      target: {
        type: "power",
        value: {
          unit: "percent_ftp",
          value: 85,
        },
      },
    },
  },
};

export const CadenceTarget: Story = {
  args: {
    step: {
      ...baseStep,
      targetType: "cadence",
      target: {
        type: "cadence",
        value: {
          unit: "rpm",
          value: 90,
        },
      },
    },
  },
};

export const PaceTarget: Story = {
  args: {
    step: {
      ...baseStep,
      targetType: "pace",
      target: {
        type: "pace",
        value: {
          unit: "min_per_km",
          value: 5.5,
        },
      },
    },
  },
};

export const DistanceDuration: Story = {
  args: {
    step: {
      ...baseStep,
      durationType: "distance",
      duration: {
        type: "distance",
        meters: 5000,
      },
    },
  },
};

export const ShortDistance: Story = {
  args: {
    step: {
      ...baseStep,
      durationType: "distance",
      duration: {
        type: "distance",
        meters: 400,
      },
    },
  },
};

export const OpenDuration: Story = {
  args: {
    step: {
      ...baseStep,
      durationType: "open",
      duration: {
        type: "open",
      },
      targetType: "open",
      target: {
        type: "open",
      },
    },
  },
};

export const CaloriesDuration: Story = {
  args: {
    step: {
      ...baseStep,
      durationType: "calories",
      duration: {
        type: "calories",
        calories: 100,
      },
    },
  },
};

export const ComplexStep: Story = {
  args: {
    step: {
      stepIndex: 5,
      name: "Threshold Interval",
      durationType: "time",
      duration: {
        type: "time",
        seconds: 480,
      },
      targetType: "power",
      target: {
        type: "power",
        value: {
          unit: "percent_ftp",
          value: 95,
        },
      },
      intensity: "active",
      notes: "Hold steady power, focus on smooth pedaling",
    },
  },
};

export const LongDuration: Story = {
  args: {
    step: {
      ...baseStep,
      duration: {
        type: "time",
        seconds: 3600,
      },
    },
  },
};
