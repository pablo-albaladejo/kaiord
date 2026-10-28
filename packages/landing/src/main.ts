import "./main.css";
import { setupInstallWidget, setupSmoothScroll } from "./install-widget";
import { setupAnalytics } from "./setup-analytics";
import { setupWebMcp } from "./webmcp";

document.addEventListener("DOMContentLoaded", () => {
  setupInstallWidget();
  setupSmoothScroll();
  setupAnalytics();
  setupWebMcp();
});
