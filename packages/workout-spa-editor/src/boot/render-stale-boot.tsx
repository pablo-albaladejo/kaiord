import { StrictMode } from "react";
import type { Root } from "react-dom/client";

import { resolveLocale } from "../application/resolve-locale";
import { StaleSchemaScreen } from "../components/organisms/StaleSchemaDialog/StaleSchemaScreen";
import { ThemeProvider } from "../contexts/ThemeContext";
import { setActiveLocale } from "../i18n/i18n";
import { StaticLocaleProvider } from "../i18n/LocaleProvider";

const noDraft = (): void => undefined;

/**
 * The stale screen renders without the app's providers: those read the
 * database, and this tab must never open it. The locale comes from the
 * browser alone, since the stored preference lives in that database. There
 * is no draft at boot: nothing was loaded into the editor yet.
 */
export async function renderStaleBoot(root: Root): Promise<void> {
  const locale = resolveLocale(undefined, navigator.language);
  // Without its catalog the dialog still renders, in English.
  await setActiveLocale(locale).catch(() => undefined);
  root.render(
    <StrictMode>
      <ThemeProvider defaultTheme="dark">
        <StaticLocaleProvider locale={locale}>
          <StaleSchemaScreen
            autoUpdate
            hasDraft={false}
            onDownloadDraft={noDraft}
          />
        </StaticLocaleProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
