import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useConnectionActions } from "../../../hooks/use-connection-actions";
import { ApiKeyConnectForm } from "./ApiKeyConnectForm";

type Props = {
  source: ConnectionSource;
  profileId: string;
  onDone: () => void;
};

/** The api-key connect flow, reusing the validated form the Athlete page
    already ships so there is one key-entry path, not two. */
export function ConnectionApiKeyPanel({ source, profileId, onDone }: Props) {
  const { connect } = useConnectionActions(profileId);
  return (
    <div
      className="border-t border-edge-soft pt-3"
      data-testid={`connection-apikey-${source.id}`}
    >
      <ApiKeyConnectForm
        onConnect={async (key) => {
          await connect(source.id, source.mechanism, key);
          onDone();
        }}
        onCancel={onDone}
      />
    </div>
  );
}
