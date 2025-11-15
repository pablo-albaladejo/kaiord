import type { Meta, StoryObj } from "@storybook/react";
import {
  Activity,
  Copy,
  Download,
  Edit,
  Gauge,
  Heart,
  Moon,
  Pause,
  Play,
  Plus,
  Repeat,
  Route,
  Save,
  Settings,
  Square,
  Sun,
  Timer,
  Trash2,
  Upload,
  User,
  Zap,
} from "lucide-react";
import { Icon } from "./Icon";

const meta = {
  title: "Atoms/Icon",
  component: Icon,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    icon: {
      control: false,
      description: "The lucide-react icon component to render",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Size of the icon",
    },
    color: {
      control: "select",
      options: [
        "default",
        "primary",
        "secondary",
        "success",
        "warning",
        "danger",
        "muted",
      ],
      description: "Color variant",
    },
    strokeWidth: {
      control: { type: "range", min: 1, max: 4, step: 0.5 },
      description: "Stroke width of the icon",
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: Heart,
    size: "md",
    color: "default",
    strokeWidth: 2,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Icon icon={Heart} size="xs" />
      <Icon icon={Heart} size="sm" />
      <Icon icon={Heart} size="md" />
      <Icon icon={Heart} size="lg" />
      <Icon icon={Heart} size="xl" />
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex gap-4">
      <Icon icon={Heart} color="default" />
      <Icon icon={Heart} color="primary" />
      <Icon icon={Heart} color="secondary" />
      <Icon icon={Heart} color="success" />
      <Icon icon={Heart} color="warning" />
      <Icon icon={Heart} color="danger" />
      <Icon icon={Heart} color="muted" />
    </div>
  ),
};

export const StrokeWidths: Story = {
  render: () => (
    <div className="flex gap-4">
      <Icon icon={Heart} strokeWidth={1} size="lg" />
      <Icon icon={Heart} strokeWidth={2} size="lg" />
      <Icon icon={Heart} strokeWidth={3} size="lg" />
      <Icon icon={Heart} strokeWidth={4} size="lg" />
    </div>
  ),
};

export const TargetTypeIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Zap} color="warning" size="lg" />
        <span className="text-xs text-gray-600">Power</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Heart} color="danger" size="lg" />
        <span className="text-xs text-gray-600">Heart Rate</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Gauge} color="primary" size="lg" />
        <span className="text-xs text-gray-600">Cadence</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Activity} color="success" size="lg" />
        <span className="text-xs text-gray-600">Pace</span>
      </div>
    </div>
  ),
};

export const DurationIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Timer} color="primary" size="lg" />
        <span className="text-xs text-gray-600">Time</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Route} color="primary" size="lg" />
        <span className="text-xs text-gray-600">Distance</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Repeat} color="primary" size="lg" />
        <span className="text-xs text-gray-600">Repeat</span>
      </div>
    </div>
  ),
};

export const ActionIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Icon icon={Play} color="success" />
      <Icon icon={Pause} color="warning" />
      <Icon icon={Square} color="danger" />
      <Icon icon={Plus} color="primary" />
      <Icon icon={Trash2} color="danger" />
      <Icon icon={Copy} color="secondary" />
      <Icon icon={Edit} color="primary" />
      <Icon icon={Save} color="success" />
    </div>
  ),
};

export const FileIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Upload} color="primary" size="lg" />
        <span className="text-xs text-gray-600">Import</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Download} color="primary" size="lg" />
        <span className="text-xs text-gray-600">Export</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={Save} color="success" size="lg" />
        <span className="text-xs text-gray-600">Save</span>
      </div>
    </div>
  ),
};

export const SettingsIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Icon icon={Settings} color="secondary" size="lg" />
      <Icon icon={User} color="primary" size="lg" />
      <Icon icon={Moon} color="secondary" size="lg" />
      <Icon icon={Sun} color="warning" size="lg" />
    </div>
  ),
};

export const InButtons: Story = {
  render: () => (
    <div className="flex gap-4">
      <button className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
        <Icon icon={Plus} size="sm" color="default" className="text-white" />
        Add Step
      </button>
      <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50">
        <Icon icon={Save} size="sm" color="success" />
        Save
      </button>
      <button className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">
        <Icon icon={Trash2} size="sm" color="default" className="text-white" />
        Delete
      </button>
    </div>
  ),
};

export const AllCommonIcons: Story = {
  render: () => (
    <div className="grid grid-cols-6 gap-6">
      {[
        { icon: Activity, label: "Activity" },
        { icon: Heart, label: "Heart" },
        { icon: Zap, label: "Zap" },
        { icon: Gauge, label: "Gauge" },
        { icon: Timer, label: "Timer" },
        { icon: Route, label: "Route" },
        { icon: Repeat, label: "Repeat" },
        { icon: Play, label: "Play" },
        { icon: Pause, label: "Pause" },
        { icon: Square, label: "Square" },
        { icon: Plus, label: "Plus" },
        { icon: Trash2, label: "Trash2" },
        { icon: Copy, label: "Copy" },
        { icon: Edit, label: "Edit" },
        { icon: Save, label: "Save" },
        { icon: Upload, label: "Upload" },
        { icon: Download, label: "Download" },
        { icon: Settings, label: "Settings" },
        { icon: User, label: "User" },
        { icon: Moon, label: "Moon" },
        { icon: Sun, label: "Sun" },
      ].map(({ icon, label }) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <Icon icon={icon} size="lg" />
          <span className="text-xs text-gray-600">{label}</span>
        </div>
      ))}
    </div>
  ),
};
