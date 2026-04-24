import "./main.css";
import { analytics } from "./analytics";

const commands: Record<string, string> = {
  npm: "npm i @kaiord/core",
  yarn: "yarn add @kaiord/core",
  pnpm: "pnpm add @kaiord/core",
  bun: "bun add @kaiord/core",
};

function setup() {
  const cmdEl = document.getElementById("install-cmd");
  const copyBtn = document.getElementById("copy-btn");
  const feedback = document.getElementById("copy-feedback");
  const tabs = document.querySelectorAll<HTMLButtonElement>(".pm-tab");
  const select = document.getElementById("pm-select") as HTMLSelectElement;

  function updateCommand(pm: string) {
    if (cmdEl) cmdEl.textContent = commands[pm] ?? commands.npm;
  }

  function setActiveTab(pm: string) {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.pm === pm;
      tab.setAttribute("aria-selected", String(isActive));
      tab.classList.toggle("text-[var(--brand-text-primary)]", isActive);
      tab.classList.toggle("bg-[var(--brand-bg-primary)]", isActive);
      tab.classList.toggle("text-[var(--brand-text-muted)]", !isActive);
    });
  }

  // Desktop tabs — WAI-ARIA Tabs pattern (arrow keys)
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const pm = tab.dataset.pm ?? "npm";
      setActiveTab(pm);
      updateCommand(pm);
    });
    tab.addEventListener("keydown", (e) => {
      const tabArr = Array.from(tabs);
      const idx = tabArr.indexOf(tab);
      let next = idx;
      if (e.key === "ArrowRight") next = (idx + 1) % tabArr.length;
      else if (e.key === "ArrowLeft")
        next = (idx - 1 + tabArr.length) % tabArr.length;
      else return;
      e.preventDefault();
      const target = tabArr[next];
      target.focus();
      target.click();
    });
  });

  // Mobile select
  select?.addEventListener("change", () => {
    updateCommand(select.value);
  });

  // Copy to clipboard
  copyBtn?.addEventListener("click", async () => {
    try {
      const text = cmdEl?.textContent ?? "";
      await navigator.clipboard.writeText(text);
      if (feedback) {
        feedback.textContent = "Copied!";
        setTimeout(() => {
          feedback.textContent = "";
        }, 2000);
      }
    } catch {
      /* clipboard not available in insecure contexts */
    }
  });

  // Smooth scroll for anchor links
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href") ?? "");
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

function setupAnalytics() {
  analytics.pageView(window.location.pathname);

  document
    .querySelectorAll<HTMLAnchorElement>('a[href="/editor/"]')
    .forEach((a) => {
      a.addEventListener("click", () => analytics.event("editor-opened"));
    });

  document
    .querySelectorAll<HTMLAnchorElement>(
      'a[href^="https://github.com/pablo-albaladejo/kaiord"]'
    )
    .forEach((a) => {
      a.addEventListener("click", () => analytics.event("github-opened"));
    });

  document
    .querySelectorAll<HTMLAnchorElement>('a[href="/docs/"]')
    .forEach((a) => {
      a.addEventListener("click", () => analytics.event("docs-opened"));
    });
}

document.addEventListener("DOMContentLoaded", () => {
  setup();
  setupAnalytics();
});
