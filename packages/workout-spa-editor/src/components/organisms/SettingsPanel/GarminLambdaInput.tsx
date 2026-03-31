import { useState } from "react";
import { isValidLambdaUrl } from "../../../store/garmin-store";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";

type GarminLambdaInputProps = {
  lambdaUrl: string;
  onUrlChange: (url: string) => void;
  onReset: () => void;
};

export const GarminLambdaInput: React.FC<GarminLambdaInputProps> = ({
  lambdaUrl,
  onUrlChange,
  onReset,
}) => {
  const [urlError, setUrlError] = useState("");

  const handleBlur = () => {
    if (lambdaUrl && !isValidLambdaUrl(lambdaUrl)) {
      setUrlError("URL must use HTTPS (except localhost)");
    } else {
      setUrlError("");
    }
  };

  return (
    <div className="space-y-2">
      <Input
        label="URL"
        placeholder="https://xxxxxxxxxx.execute-api.eu-west-1.amazonaws.com/push"
        value={lambdaUrl}
        onChange={(e) => {
          onUrlChange(e.target.value);
          setUrlError("");
        }}
        onBlur={handleBlur}
        helperText={urlError || "Self-hosted? Enter your Lambda URL here."}
        error={urlError || undefined}
      />
      <Button size="sm" variant="secondary" onClick={onReset}>
        Reset to Default
      </Button>
    </div>
  );
};
