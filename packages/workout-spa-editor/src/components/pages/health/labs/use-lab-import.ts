/**
 * useLabImport — drives one lab-document extraction: guards file size, reads
 * the bytes, resolves the profile's model, and runs the extractor with a
 * cancelable signal. `canImport` mirrors the settings model resolution so the
 * section can disable itself when no lab-extraction model is configured.
 */
import { resolveModelForPurpose } from "@kaiord/ai/providers";
import { useRef, useState } from "react";

import { runLabExtraction } from "../../../../application/lab/extraction/run-lab-extraction.use-case";
import { useToastContext } from "../../../../contexts/ToastContext";
import { useActiveProfileLive } from "../../../../hooks/use-active-profile-live";
import { useAiModelBindingsLive } from "../../../../hooks/use-ai-model-bindings-live";
import { useAiProvidersLive } from "../../../../hooks/use-ai-providers-live";
import { useActiveLocale } from "../../../../i18n/LocaleProvider";
import { validateFileSize } from "../../../molecules/FileUpload/file-upload-constants";
import { type LabDraft, mapExtractionToDraft } from "./map-extraction-to-draft";

const TOO_LARGE_MSG = "File is too large — use a file under 10 MB";
const RUN_FAILED_MSG = "Could not extract the lab report — please retry";
const NO_PROVIDER_MSG = "No lab-extraction model is configured";

export function useLabImport(onDraft: (draft: LabDraft) => void) {
  const toast = useToastContext();
  const locale = useActiveLocale();
  const providers = useAiProvidersLive() ?? [];
  const active = useActiveProfileLive();
  const bindings = useAiModelBindingsLive(active?.id ?? null) ?? [];
  const [isRunning, setIsRunning] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const canImport =
    resolveModelForPurpose("lab_extraction", providers, bindings) !== null;

  const run = async (file: File) => {
    if (validateFileSize(file)) {
      toast.error(TOO_LARGE_MSG);
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsRunning(true);
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const result = await runLabExtraction({
        file: { data, mediaType: file.type, filename: file.name },
        providers,
        bindings,
        signal: controller.signal,
      });
      if (!result.ok) toast.error(NO_PROVIDER_MSG);
      else onDraft(mapExtractionToDraft(result.extraction, { locale }));
    } catch {
      if (!controller.signal.aborted) toast.error(RUN_FAILED_MSG);
    } finally {
      setIsRunning(false);
      controllerRef.current = null;
    }
  };

  const cancel = () => controllerRef.current?.abort();

  return { canImport, isRunning, run, cancel };
}
