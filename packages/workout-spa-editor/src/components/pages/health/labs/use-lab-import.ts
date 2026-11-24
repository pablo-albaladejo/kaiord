/**
 * useLabImport — drives one lab-document extraction: guards file size, reads
 * the bytes, resolves the profile's model, and runs the extractor with a
 * cancelable signal. `canImport` mirrors the settings model resolution so the
 * section can disable itself when no lab-extraction model is configured.
 */
import {
  isModelNotFoundError,
  resolveModelForPurpose,
} from "@kaiord/ai/providers";
import { useRef, useState } from "react";

import { runLabExtraction } from "../../../../application/lab/extraction/run-lab-extraction.use-case";
import { startTraceRun } from "../../../../application/trace/trace-run";
import { useToastContext } from "../../../../contexts/ToastContext";
import { useActiveProfileLive } from "../../../../hooks/use-active-profile-live";
import { useAiModelBindingsLive } from "../../../../hooks/use-ai-model-bindings-live";
import { useAiProvidersLive } from "../../../../hooks/use-ai-providers-live";
import { useGenerationDeps } from "../../../../hooks/use-generation-deps";
import { useActiveLocale } from "../../../../i18n/LocaleProvider";
import { useTranslate } from "../../../../i18n/use-translate";
import { healthSharingGate } from "../../../../lib/health-sharing-gate";
import { useUnsavedWork } from "../../../../lib/use-unsaved-work";
import { validateFileSize } from "../../../molecules/FileUpload/file-upload-constants";
import { type LabDraft, mapExtractionToDraft } from "./map-extraction-to-draft";

export function useLabImport(onDraft: (draft: LabDraft) => void) {
  const toast = useToastContext();
  const locale = useActiveLocale();
  const t = useTranslate("errors");
  const providers = useAiProvidersLive() ?? [];
  const active = useActiveProfileLive();
  const bindings = useAiModelBindingsLive(active?.id ?? null) ?? [];
  const [isRunning, setIsRunning] = useState(false);
  useUnsavedWork(isRunning);
  const controllerRef = useRef<AbortController | null>(null);
  const { persistence, usage: telemetry } = useGenerationDeps();

  const canImport =
    resolveModelForPurpose("lab_extraction", providers, bindings) !== null;

  const run = async (file: File) => {
    if (validateFileSize(file)) {
      toast.error(t("labImport.tooLarge"));
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsRunning(true);
    const trace = startTraceRun({
      feature: "lab_import",
      traces: persistence.traces,
    });
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const result = await runLabExtraction({
        file: { data, mediaType: file.type, filename: file.name },
        providers,
        bindings,
        signal: controller.signal,
        telemetry,
        trace,
        askHealth: (providerType) =>
          healthSharingGate.request(
            { flow: "labImport", providerType },
            { signal: controller.signal, onWait: () => void trace.checkpoint() }
          ),
      });
      if (result.ok)
        onDraft(mapExtractionToDraft(result.extraction, { locale }));
      else if (result.reason === "withheld")
        toast.info(t("labImport.withheld"));
      else toast.error(t("labImport.noModel"));
    } catch (error) {
      if (controller.signal.aborted) return;
      if (isModelNotFoundError(error)) toast.error(t("ai.modelUnavailable"));
      else toast.error(t("labImport.runFailed"));
    } finally {
      setIsRunning(false);
      controllerRef.current = null;
    }
  };

  const cancel = () => controllerRef.current?.abort();

  return { canImport, isRunning, run, cancel };
}
