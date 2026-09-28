import DefaultTheme from "vitepress/theme-without-fonts";
import TwoslashFloatingVue from "@shikijs/vitepress-twoslash/client";
import "@shikijs/vitepress-twoslash/style.css";
import "./custom.css";
import NotFound from "./NotFound.vue";

import type { EnhanceAppContext } from "vitepress";

export default {
  extends: DefaultTheme,
  NotFound,
  enhanceApp({ app }: EnhanceAppContext) {
    app.use(TwoslashFloatingVue);
  },
};
