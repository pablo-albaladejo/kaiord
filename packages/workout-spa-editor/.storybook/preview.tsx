import type { Preview } from "@storybook/react-vite";

import { GarminBridgeProvider } from "../src/contexts/garmin-bridge-context";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { UnitsProvider } from "../src/contexts/units-context";
import { LocaleProvider } from "../src/i18n/LocaleProvider";
import "../src/index.css";

const preview: Preview = {
  // Global providers. Without these, any component reaching for theme, copy,
  // units or bridge state renders only if its own story remembers to wrap it —
  // and most do not, so they threw "must be used within a Provider" and
  // storybook showed an empty root. Stories that wrap themselves still work:
  // the inner provider wins for its own subtree.
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="light">
        <LocaleProvider>
          <UnitsProvider>
            <GarminBridgeProvider>
              <Story />
            </GarminBridgeProvider>
          </UnitsProvider>
        </LocaleProvider>
      </ThemeProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        {
          name: "light",
          value: "#ffffff",
        },
        {
          name: "dark",
          value: "#0f172a",
        },
      ],
    },
  },
};

export default preview;
