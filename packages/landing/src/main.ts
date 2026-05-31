import "./main.css";
import { setupInstallWidget, setupSmoothScroll } from "./install-widget";
import { setupAnalytics } from "./setup-analytics";

document.addEventListener("DOMContentLoaded", () => {
  setupInstallWidget();
  setupSmoothScroll();
  setupAnalytics();
});
