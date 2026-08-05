<script setup lang="ts">
import { onMounted, ref } from "vue";

// The trigger is a button that says what it does, not a fake input: the only
// way to open VitePress's local search is its keyboard shortcut, and
// VPLocalSearchBox exposes no API to preload a query. A field that collects
// text and then drops it promises something it cannot deliver — worse than no
// field, and this is the page you land on when you already failed to find
// something.
const shortcut = ref("⌘ K");

onMounted(() => {
  if (!/Mac|iPhone|iPad/.test(navigator.platform)) {
    shortcut.value = "Ctrl K";
  }
});

function openSearch() {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
  );
}
</script>

<template>
  <div class="not-found">
    <div class="container">
      <h1 class="title">404</h1>
      <p class="subtitle">Page not found</p>
      <p class="description">
        It may have moved. The search covers every page, including the API
        reference.
      </p>

      <button class="search-btn" @click="openSearch">
        Search the documentation
        <kbd class="kbd">{{ shortcut }}</kbd>
      </button>

      <div class="links">
        <a href="/docs/guide/quick-start" class="link">Quick Start</a>
        <a href="/docs/formats/krd" class="link">Formats</a>
        <a href="/docs/" class="link">Docs Home</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 2rem;
  text-align: center;
}

.container {
  max-width: 480px;
}

/* Ink at 38px, not brand color at 4rem: whoever lands here does not need
   the number shouted — they need a way out. The weight goes on the exit. */
.title {
  font-size: 38px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0;
  line-height: 1;
}

.subtitle {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0.5rem 0;
}

.description {
  color: var(--vp-c-text-2);
  margin: 1rem 0 2rem;
}

.search-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: var(--control);
  color: var(--control-ink);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 2rem;
}

.search-btn:hover {
  opacity: 0.85;
}

.kbd {
  font-family: inherit;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid currentColor;
  opacity: 0.7;
}

.links {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.link {
  padding: 8px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  font-size: 14px;
  transition: border-color 0.2s;
}

.link:hover {
  border-color: var(--vp-c-text-3);
}
</style>
