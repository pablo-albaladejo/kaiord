import { useEffect, useState } from "react";

import { db } from "../../packages/workout-spa-editor/src/adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../packages/workout-spa-editor/src/adapters/dexie/dexie-persistence-adapter";
import { addProvider } from "../../packages/workout-spa-editor/src/application/ai/add-provider";
import { AiWorkoutInput } from "../../packages/workout-spa-editor/src/components/organisms/AiWorkoutInput/AiWorkoutInput";
import type { useAiRuntimeStore as UseAiRuntimeStore } from "../../packages/workout-spa-editor/src/store/ai-runtime-store";
import type { GenerationState } from "../../packages/workout-spa-editor/src/store/ai-store-types";

/**
 * `useAiProvidersLive` reads the browser IndexedDB and the generation status
 * comes from `useAiRuntimeStore`; the stories seed both from a `loader` and a
 * decorator, neither of which the card harness runs. Each export seeds the
 * same way the story does (real `addProvider` write path) and only mounts the
 * component once the seed has landed, so the first read already sees it.
 */
/**
 * The runtime store must be the bundle's own singleton (a source import
 * compiles a second zustand copy the component never reads), so it is read
 * off the global; it needs `useAiRuntimeStore` in the design-system entry.
 */
const bundle = (
  window as unknown as {
    KaiordDesignSystem: { useAiRuntimeStore?: typeof UseAiRuntimeStore };
  }
).KaiordDesignSystem;

const seedProviders = async (withProvider: boolean) => {
  await db.table("aiProviders").clear();
  if (!withProvider) return;
  await addProvider(createDexiePersistence(db), {
    type: "anthropic",
    apiKey: "sk-ant-demo-not-a-real-key",
    label: "Team Claude",
  });
};

const noop = () => {};

function SeededInput({
  withProvider,
  generation,
}: {
  withProvider: boolean;
  generation: GenerationState;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    void seedProviders(withProvider).then(() => {
      bundle.useAiRuntimeStore?.setState({ generation });
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [withProvider, generation]);
  return ready ? <AiWorkoutInput onSettingsClick={noop} /> : null;
}

const IDLE: GenerationState = { status: "idle" };
const LOADING: GenerationState = { status: "loading" };
const FAILED: GenerationState = {
  status: "error",
  message: "Anthropic rejected the request: invalid API key.",
};

/** No AI provider configured — the empty state of a fresh browser profile. */
export const NoProviderConfigured = () => (
  <SeededInput withProvider={false} generation={IDLE} />
);

/** A provider is configured; the prompt is empty so Generate stays disabled. */
export const ReadyToGenerate = () => (
  <SeededInput withProvider generation={IDLE} />
);

/** A generation request is in flight — textarea and Generate both disable. */
export const GenerationInProgress = () => (
  <SeededInput withProvider generation={LOADING} />
);

/** The provider rejected the last request — the error renders inline. */
export const GenerationFailed = () => (
  <SeededInput withProvider generation={FAILED} />
);
