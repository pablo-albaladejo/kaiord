// Vanilla island for the developer install widget: package-manager tabs
// (WAI-ARIA roving tabindex), a mobile <select> mirror, and a copy button
// that flips to a checkmark for ~1.4s.

export const commands: Record<string, string> = {
  npm: "npm i @kaiord/core",
  yarn: "yarn add @kaiord/core",
  pnpm: "pnpm add @kaiord/core",
  bun: "bun add @kaiord/core",
};

type Root = Document | HTMLElement;

function updateCommand(cmdEl: HTMLElement | null, pm: string): void {
  if (cmdEl) cmdEl.textContent = commands[pm] ?? commands.npm;
}

function setActiveTab(tabs: NodeListOf<HTMLButtonElement>, pm: string): void {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.pm === pm;
    tab.setAttribute("aria-selected", String(isActive));
    tab.setAttribute("tabindex", isActive ? "0" : "-1");
    tab.classList.toggle("text-[var(--brand-text-primary)]", isActive);
    tab.classList.toggle("bg-[var(--brand-bg-primary)]", isActive);
    tab.classList.toggle("text-[var(--brand-text-muted)]", !isActive);
  });
}

function wireTabs(
  tabs: NodeListOf<HTMLButtonElement>,
  cmdEl: HTMLElement | null
): void {
  const arr = Array.from(tabs);
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const pm = tab.dataset.pm ?? "npm";
      setActiveTab(tabs, pm);
      updateCommand(cmdEl, pm);
    });
    tab.addEventListener("keydown", (e) => {
      const idx = arr.indexOf(tab);
      let next: number;
      if (e.key === "ArrowRight") next = (idx + 1) % arr.length;
      else if (e.key === "ArrowLeft")
        next = (idx - 1 + arr.length) % arr.length;
      else return;
      e.preventDefault();
      arr[next].focus();
      arr[next].click();
    });
  });
}

function wireCopy(root: Root, cmdEl: HTMLElement | null): void {
  const btn = root.querySelector<HTMLButtonElement>("#copy-btn");
  const feedback = root.querySelector<HTMLElement>("#copy-feedback");
  const copyIcon = root.querySelector<SVGElement>("#copy-icon");
  const checkIcon = root.querySelector<SVGElement>("#check-icon");
  btn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(cmdEl?.textContent ?? "");
      if (feedback)
        feedback.textContent =
          document.documentElement.lang === "es" ? "¡Copiado!" : "Copied!";
      copyIcon?.classList.add("hidden");
      checkIcon?.classList.remove("hidden");
      setTimeout(() => {
        if (feedback) feedback.textContent = "";
        copyIcon?.classList.remove("hidden");
        checkIcon?.classList.add("hidden");
      }, 1400);
    } catch {
      /* clipboard unavailable in insecure contexts */
    }
  });
}

export function setupInstallWidget(root: Root = document): void {
  const cmdEl = root.querySelector<HTMLElement>("#install-cmd");
  const tabs = root.querySelectorAll<HTMLButtonElement>(".pm-tab");
  const select = root.querySelector<HTMLSelectElement>("#pm-select");
  const initial =
    Array.from(tabs).find((t) => t.getAttribute("aria-selected") === "true") ??
    tabs[0];
  if (initial) setActiveTab(tabs, initial.dataset.pm ?? "npm");
  wireTabs(tabs, cmdEl);
  select?.addEventListener("change", () => updateCommand(cmdEl, select.value));
  wireCopy(root, cmdEl);
}

export function setupSmoothScroll(root: Root = document): void {
  root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = root.querySelector(a.getAttribute("href") ?? "");
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}
