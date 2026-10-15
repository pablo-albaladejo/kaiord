import { useTranslate } from "../../../i18n/use-translate";
import {
  encodeChoice,
  encodeCustom,
  type ModelChoiceGroup,
} from "./model-choice";

const TYPE_NAMES = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
};

/** One optgroup per account: its models, then "Custom…". */
export function ModelChoiceOptions({ groups }: { groups: ModelChoiceGroup[] }) {
  const t = useTranslate("settings");
  return groups.map(({ provider, models }) => (
    <optgroup
      key={provider.id}
      label={`${provider.label} · ${TYPE_NAMES[provider.type]}`}
    >
      {models.map((modelId) => (
        <option
          key={modelId}
          value={encodeChoice({ providerId: provider.id, modelId })}
        >
          {`${modelId} · ${provider.label}`}
        </option>
      ))}
      <option value={encodeCustom(provider.id)}>{t("models.custom")}</option>
    </optgroup>
  ));
}
