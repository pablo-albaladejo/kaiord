import { Button } from "./Button";

/**
 * Button Component Examples
 *
 * This file demonstrates all variants, sizes, and states of the Button component.
 * Can be used as a visual reference or converted to Storybook stories.
 */

export const ButtonExamples = () => {
  return (
    <div className="space-y-8 p-8">
      {/* Variants */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </section>

      {/* Sizes */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Sizes</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      {/* States */}
      <section>
        <h2 className="mb-4 text-xl font-bold">States</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Normal</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
      </section>

      {/* Combinations */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Combinations</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" size="sm">
              Small Primary
            </Button>
            <Button variant="secondary" size="lg">
              Large Secondary
            </Button>
            <Button variant="danger" size="sm" disabled>
              Small Danger Disabled
            </Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" loading>
              Saving...
            </Button>
            <Button variant="danger" loading>
              Deleting...
            </Button>
          </div>
        </div>
      </section>

      {/* Real-world Examples */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Real-world Examples</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="primary">Save Workout</Button>
            <Button variant="secondary">Cancel</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              Copy
            </Button>
            <Button variant="ghost" size="sm">
              Paste
            </Button>
            <Button variant="ghost" size="sm">
              Duplicate
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="lg">
              Create New Workout
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="danger" size="sm">
              Delete Step
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
