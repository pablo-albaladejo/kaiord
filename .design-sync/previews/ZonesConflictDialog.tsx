import * as S from "@ds-stories/packages/workout-spa-editor/src/components/organisms/ZonesConflictDialog/ZonesConflictDialog.stories";
import { ZonesConflictDialog } from "../../packages/workout-spa-editor/src/components/organisms/ZonesConflictDialog/ZonesConflictDialog";

// ZonesConflictDialog renders `fixed inset-0` in place (no portal). The card
// harness wraps each story in a zero-height `transform: translateZ(0)` box that
// becomes that overlay's containing block, so it collapses above y=0. The
// viewport-height frame restores the containing block the real app has.
type Props = React.ComponentProps<typeof ZonesConflictDialog>;

const Frame = ({ args }: { args: Partial<Props> | undefined }) => (
  <div style={{ height: "100vh" }}>
    <ZonesConflictDialog {...(args as Props)} />
  </div>
);

export const ScalarConflicts = () => <Frame args={S.ScalarConflicts.args} />;
export const BandGroupConflict = () => (
  <Frame args={S.BandGroupConflict.args} />
);
export const CoupledFtpAndPowerZones = () => (
  <Frame args={S.CoupledFtpAndPowerZones.args} />
);
export const MixedScalarAndBandGroups = () => (
  <Frame args={S.MixedScalarAndBandGroups.args} />
);
