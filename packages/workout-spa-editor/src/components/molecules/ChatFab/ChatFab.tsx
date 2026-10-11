import { MessageCircle } from "lucide-react";
import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";

/**
 * Floating chat button. Navigates to the `/chat` routed page (chat is a
 * routed page, not an overlay — per the SPA surface-classification rule), so
 * deep-linking and history are preserved. Desktop-only (`md:`): on mobile the
 * bottom-nav owns the bottom corner and the header entry covers chat. Hidden
 * while already on the chat route.
 *
 * Its geometry comes from the `--chat-fab-*` tokens in index.css, which the
 * main layout's bottom padding also reads.
 *
 * Neutral floating chrome, never `cta`: this is an entry to a route present
 * on every screen, not any surface's primary action — magenta here would be
 * decoration with no work to do.
 */
export function ChatFab() {
  const [location, navigate] = useLocation();
  const t = useTranslate("nav");
  if (location === "/chat" || location.startsWith("/chat/")) return null;

  return (
    <button
      type="button"
      aria-label={t("aria.chat")}
      title={t("chatAssistant")}
      data-testid="chat-fab"
      onClick={() => navigate("/chat")}
      className="fixed bottom-(--chat-fab-offset) right-(--chat-fab-offset) z-30 hidden h-(--chat-fab-size) w-(--chat-fab-size) items-center justify-center rounded-full border border-edge bg-surface-elevated text-ink-strong shadow-lg transition hover:bg-ink-strong/10 focus-visible:ring-2 focus-visible:ring-edge-strong md:flex"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}
