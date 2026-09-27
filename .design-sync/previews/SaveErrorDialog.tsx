import * as S from "@ds-stories/packages/workout-spa-editor/src/components/molecules/SaveErrorDialog/SaveErrorDialog.stories";
import { SaveErrorDialog } from "../../packages/workout-spa-editor/src/components/molecules/SaveErrorDialog/SaveErrorDialog";

// SaveErrorDialog renders `fixed inset-0` in place (no portal). The card
// harness wraps each story in a zero-height `transform: translateZ(0)` box that
// becomes that overlay's containing block, so it collapses above y=0. The
// viewport-height frame restores the containing block the real app has.
type Props = React.ComponentProps<typeof SaveErrorDialog>;

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div style={{ height: "100vh" }}>{children}</div>
);

const fromArgs = (args: Partial<Props> | undefined) => () => (
  <Frame>
    <SaveErrorDialog {...(args as Props)} />
  </Frame>
);

export const Default = fromArgs(S.Default.args);
export const MultipleErrors = fromArgs(S.MultipleErrors.args);
export const NestedPathErrors = fromArgs(S.NestedPathErrors.args);
export const ManyErrors = fromArgs(S.ManyErrors.args);
export const ErrorsWithoutPaths = fromArgs(S.ErrorsWithoutPaths.args);

// Interactive builds its own element in `render` and ignores args.
export const Interactive = () => (
  <Frame>{S.Interactive.render?.({} as never, {} as never)}</Frame>
);
