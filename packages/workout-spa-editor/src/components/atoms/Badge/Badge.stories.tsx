import { Badge } from "./Badge";

/**
 * Badge Component Examples
 *
 * This file demonstrates all variants, sizes, and states of the Badge component.
 * Can be used as a visual reference or converted to Storybook stories.
 */

export const BadgeExamples = () => {
  return (
    <div className="space-y-8 p-8">
      <section>
        <h2 className="mb-4 text-xl font-bold">Intensity Variants</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="warmup">Warmup</Badge>
          <Badge variant="active">Active</Badge>
          <Badge variant="cooldown">Cooldown</Badge>
          <Badge variant="rest">Rest</Badge>
          <Badge variant="recovery">Recovery</Badge>
          <Badge variant="interval">Interval</Badge>
          <Badge variant="other">Other</Badge>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Target Type Variants</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="power">Power</Badge>
          <Badge variant="heart_rate">Heart Rate</Badge>
          <Badge variant="cadence">Cadence</Badge>
          <Badge variant="pace">Pace</Badge>
          <Badge variant="stroke_type">Stroke Type</Badge>
          <Badge variant="open">Open</Badge>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Sizes</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
          <Badge size="lg">Large</Badge>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">With Icons</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="power" icon={<span>⚡</span>}>
            Power
          </Badge>
          <Badge variant="heart_rate" icon={<span>❤️</span>}>
            Heart Rate
          </Badge>
          <Badge variant="cadence" icon={<span>🔄</span>}>
            Cadence
          </Badge>
          <Badge variant="pace" icon={<span>🏃</span>}>
            Pace
          </Badge>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Real-world Examples</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="warmup" size="sm">
              5 min warmup
            </Badge>
            <Badge variant="active" size="md" icon={<span>⚡</span>}>
              Zone 4 Power
            </Badge>
            <Badge variant="cooldown" size="sm">
              Cool down
            </Badge>
          </div>
        </div>
      </section>
    </div>
  );
};
