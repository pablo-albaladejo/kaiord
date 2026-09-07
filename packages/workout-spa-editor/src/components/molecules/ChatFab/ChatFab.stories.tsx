import type { Meta, StoryObj } from "@storybook/react";

import { ChatFab } from "./ChatFab";

const meta = {
  title: "Molecules/ChatFab",
  component: ChatFab,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Floating entry to the routed `/chat` page. Desktop-only (`md:`), and hidden whenever the current route is already inside chat — it has nowhere useful to send you from there.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ChatFab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Visible: Story = {
  parameters: { route: "/calendar" },
};

export const HiddenOnChatRoute: Story = {
  name: "Hidden on /chat (renders nothing)",
  parameters: {
    route: "/chat",
    docs: {
      description: {
        story:
          '`location === "/chat"` short-circuits to `null` — this canvas is intentionally empty.',
      },
    },
  },
};

export const HiddenOnChatThreadRoute: Story = {
  name: "Hidden on a chat thread route (renders nothing)",
  parameters: {
    route: "/chat/session-42",
    docs: {
      description: {
        story:
          'The hide check is a prefix match (`location.startsWith("/chat/")`), not just the bare route — this canvas is intentionally empty too.',
      },
    },
  },
};
