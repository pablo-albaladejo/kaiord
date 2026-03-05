import { useGarminStore } from "../../../store/garmin-store";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";

export const GarminTab: React.FC = () => {
  const {
    username,
    password,
    lambdaUrl,
    setCredentials,
    setLambdaUrl,
    resetLambdaUrl,
  } = useGarminStore();

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Garmin Connect Credentials
        </h3>
        <div className="space-y-3">
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={username}
            onChange={(e) => setCredentials(e.target.value, password)}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Your Garmin password"
            value={password}
            onChange={(e) => setCredentials(username, e.target.value)}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Lambda Endpoint
        </h3>
        <div className="space-y-2">
          <Input
            label="URL"
            placeholder="https://api.kaiord.com/push"
            value={lambdaUrl}
            onChange={(e) => setLambdaUrl(e.target.value)}
            helperText="Self-hosted? Enter your Lambda URL here."
          />
          <Button size="sm" variant="secondary" onClick={resetLambdaUrl}>
            Reset to Default
          </Button>
        </div>
      </section>
    </div>
  );
};
