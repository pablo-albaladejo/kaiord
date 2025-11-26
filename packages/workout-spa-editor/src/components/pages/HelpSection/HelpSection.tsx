import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Copy,
  FileText,
  HelpCircle,
  Keyboard,
  Layers,
  Play,
  RotateCcw,
  Save,
  Scissors,
  Zap,
} from "lucide-react";
import { Button } from "../../atoms/Button/Button";
import { resetOnboarding } from "../../organisms/OnboardingTutorial/OnboardingTutorial";

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
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white kiroween:text-white">
              Help & Documentation
            </h1>
            <p className="text-gray-600 dark:text-gray-400 kiroween:text-gray-300">
              Learn how to use the Workout Editor to create and manage
              structured workout files
            </p>
          </div>
          {onReplayTutorial && (
            <Button
              variant="secondary"
              onClick={handleReplayTutorial}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Replay Tutorial
            </Button>
          )}
        </div>
      </div>

      {/* Getting Started */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white kiroween:text-white">
            Getting Started
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
              Creating a Workout
            </h3>
            <ol className="list-decimal space-y-2 pl-5 text-gray-600 dark:text-gray-400 kiroween:text-gray-300">
              <li>Click "Create New Workout" on the welcome screen</li>
              <li>
                Enter a workout name and select a sport (cycling, running,
                swimming)
              </li>
              <li>Add workout steps by clicking "Add Step"</li>
              <li>
                Configure duration (time, distance, or open) for each step
              </li>
              <li>
                Set target intensity (power, heart rate, pace, or cadence)
              </li>
              <li>Save your workout using Ctrl+S (Cmd+S on Mac)</li>
            </ol>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
              Loading a Workout
            </h3>
            <ol className="list-decimal space-y-2 pl-5 text-gray-600 dark:text-gray-400 kiroween:text-gray-300">
              <li>Click "Load Workout" or drag and drop a file</li>
              <li>Supported formats: KRD, FIT, TCX, ZWO</li>
              <li>The workout will load and display all steps</li>
              <li>Edit any step by clicking on it</li>
            </ol>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
              Organizing Steps
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-gray-600 dark:text-gray-400 kiroween:text-gray-300">
              <li>Drag and drop steps to reorder them</li>
              <li>Use Alt+Up/Down to move selected steps</li>
              <li>
                Group steps into repetition blocks with Ctrl+G (Cmd+G on Mac)
              </li>
              <li>Ungroup blocks with Ctrl+Shift+G (Cmd+Shift+G on Mac)</li>
              <li>Copy steps with Ctrl+C and paste with Ctrl+V</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
        <div className="mb-4 flex items-center gap-2">
          <Keyboard className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white kiroween:text-white">
            Keyboard Shortcuts
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
              File Operations
            </h3>
            <div className="space-y-2">
              <ShortcutRow
                icon={<Save className="h-4 w-4" />}
                keys={["Ctrl", "S"]}
                macKeys={["Cmd", "S"]}
                description="Save workout"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
              Edit Operations
            </h3>
            <div className="space-y-2">
              <ShortcutRow
                icon={<RotateCcw className="h-4 w-4" />}
                keys={["Ctrl", "Z"]}
                macKeys={["Cmd", "Z"]}
                description="Undo"
              />
              <ShortcutRow
                icon={<RotateCcw className="h-4 w-4 rotate-180" />}
                keys={["Ctrl", "Y"]}
                macKeys={["Cmd", "Y"]}
                description="Redo"
              />
              <ShortcutRow
                icon={<Copy className="h-4 w-4" />}
                keys={["Ctrl", "C"]}
                macKeys={["Cmd", "C"]}
                description="Copy selected steps"
              />
              <ShortcutRow
                icon={<Scissors className="h-4 w-4" />}
                keys={["Ctrl", "V"]}
                macKeys={["Cmd", "V"]}
                description="Paste steps"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
              Step Management
            </h3>
            <div className="space-y-2">
              <ShortcutRow
                icon={<ArrowUp className="h-4 w-4" />}
                keys={["Alt", "↑"]}
                description="Move step up"
              />
              <ShortcutRow
                icon={<ArrowDown className="h-4 w-4" />}
                keys={["Alt", "↓"]}
                description="Move step down"
              />
              <ShortcutRow
                icon={<Layers className="h-4 w-4" />}
                keys={["Ctrl", "G"]}
                macKeys={["Cmd", "G"]}
                description="Create repetition block"
              />
              <ShortcutRow
                icon={<Layers className="h-4 w-4" />}
                keys={["Ctrl", "Shift", "G"]}
                macKeys={["Cmd", "Shift", "G"]}
                description="Ungroup block"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
              Selection
            </h3>
            <div className="space-y-2">
              <ShortcutRow
                icon={<Zap className="h-4 w-4" />}
                keys={["Ctrl", "A"]}
                macKeys={["Cmd", "A"]}
                description="Select all steps"
              />
              <ShortcutRow
                icon={<Zap className="h-4 w-4" />}
                keys={["Esc"]}
                description="Clear selection"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Examples */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white kiroween:text-white">
            Example Workouts
          </h2>
        </div>

        <div className="space-y-4">
          <ExampleWorkout
            title="Sweet Spot Intervals"
            sport="Cycling"
            description="Classic sweet spot training with 3x10 minute intervals at 88-93% FTP"
            steps={[
              "10 min warmup at 50-60% FTP",
              "3x (10 min at 88-93% FTP, 5 min recovery at 50% FTP)",
              "10 min cooldown at 50% FTP",
            ]}
          />

          <ExampleWorkout
            title="Tempo Run"
            sport="Running"
            description="Sustained tempo effort to build aerobic endurance"
            steps={[
              "15 min easy warmup",
              "20 min at tempo pace (Zone 3-4)",
              "10 min easy cooldown",
            ]}
          />

          <ExampleWorkout
            title="Swim Intervals"
            sport="Swimming"
            description="High-intensity intervals with active recovery"
            steps={[
              "400m easy warmup",
              "8x (100m hard, 50m easy)",
              "200m cooldown",
            ]}
          />
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white kiroween:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          <FAQItem
            question="What file formats are supported?"
            answer="The editor supports KRD (native format), FIT (Garmin), TCX (Training Center XML), and ZWO (Zwift) formats for both import and export."
          />

          <FAQItem
            question="How do I create a repetition block?"
            answer="Select multiple steps by clicking while holding Shift or Ctrl, then press Ctrl+G (Cmd+G on Mac) or click the 'Create Block' button. You can also drag steps into an existing block."
          />

          <FAQItem
            question="Can I use this offline?"
            answer="Yes! The editor works offline once loaded. Your workouts are saved in your browser's local storage and will be available even without an internet connection."
          />

          <FAQItem
            question="What are training zones?"
            answer="Training zones are intensity ranges based on your FTP (power) or maximum heart rate. Configure your zones in the Profile Manager to see zone-based targets in your workouts."
          />

          <FAQItem
            question="How do I export my workout?"
            answer="Click the 'Save' button and select your desired export format (KRD, FIT, TCX, or ZWO). The file will be downloaded to your device."
          />

          <FAQItem
            question="Can I undo changes?"
            answer="Yes! Use Ctrl+Z (Cmd+Z on Mac) to undo and Ctrl+Y (Cmd+Y on Mac) to redo. The editor maintains a full history of your changes."
          />

          <FAQItem
            question="What's the difference between duration types?"
            answer="Time-based durations use minutes/seconds, distance-based use meters/kilometers, and open durations continue until you manually advance (lap button press)."
          />

          <FAQItem
            question="How do I save workouts to my library?"
            answer="Click the 'Save to Library' button to store your workout locally. You can add tags and notes for easy organization and retrieval."
          />
        </div>
      </div>
    </div>
  );
}

type ShortcutRowProps = {
  icon: React.ReactNode;
  keys: Array<string>;
  macKeys?: Array<string>;
  description: string;
};

function ShortcutRow({ icon, keys, macKeys, description }: ShortcutRowProps) {
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().includes("MAC");
  const displayKeys = isMac && macKeys ? macKeys : keys;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 kiroween:text-gray-300">
        {icon}
        <span>{description}</span>
      </div>
      <div className="flex gap-1">
        {displayKeys.map((key, index) => (
          <kbd
            key={index}
            className="rounded border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 kiroween:border-gray-600 kiroween:bg-gray-700 kiroween:text-gray-200"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}

type ExampleWorkoutProps = {
  title: string;
  sport: string;
  description: string;
  steps: Array<string>;
};

function ExampleWorkout({
  title,
  sport,
  description,
  steps,
}: ExampleWorkoutProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700 kiroween:border-gray-600 kiroween:bg-gray-700">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
          {title}
        </h3>
        <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-200">
          {sport}
        </span>
      </div>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400 kiroween:text-gray-300">
        {description}
      </p>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400 kiroween:text-gray-300">
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

type FAQItemProps = {
  question: string;
  answer: string;
};

function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <div className="border-b border-gray-200 pb-4 last:border-b-0 dark:border-gray-700 kiroween:border-gray-700">
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white kiroween:text-white">
        {question}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 kiroween:text-gray-300">
        {answer}
      </p>
    </div>
  );
}
