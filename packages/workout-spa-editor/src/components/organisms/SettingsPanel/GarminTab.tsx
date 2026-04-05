import { useEffect, useState } from "react";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { useGarminStore } from "../../../store/garmin-store";
import { GarminLambdaInput } from "./GarminLambdaInput";

export const GarminTab: React.FC = () => {
  const {
    username,
    password,
    lambdaUrl,
    setCredentials,
    setLambdaUrl,
    resetLambdaUrl,
  } = useGarminStore();

  const [email, setEmail] = useState(username);
  const [pass, setPass] = useState(password);

  useEffect(() => {
    setEmail(username);
    setPass(password);
  }, [username, password]);

  const isDirty = email !== username || pass !== password;

  const handleSave = () => {
    setCredentials(email, pass);
  };

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Your Garmin password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <Button size="sm" onClick={handleSave} disabled={!isDirty}>
            Save Credentials
          </Button>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Lambda Endpoint
        </h3>
        <GarminLambdaInput
          lambdaUrl={lambdaUrl}
          onUrlChange={setLambdaUrl}
          onReset={resetLambdaUrl}
        />
      </section>
    </div>
  );
};
