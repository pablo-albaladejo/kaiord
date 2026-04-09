<script setup lang="ts">
import { useRouter } from "vitepress";
import { ref } from "vue";

const router = useRouter();
const query = ref("");

function search() {
  if (query.value.trim()) {
    // Trigger VitePress search by dispatching keyboard shortcut
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }
}
</script>

<template>
  <div class="not-found">
    <div class="container">
      <h1 class="title">404</h1>
      <p class="subtitle">Page not found</p>
      <p class="description">
        The page you are looking for does not exist or has been moved.
      </p>

      <div class="search-box">
        <input
          v-model="query"
          type="text"
          placeholder="Search documentation..."
          class="search-input"
          @keydown.enter="search"
        />
        <button class="search-btn" @click="search">Search</button>
      </div>

      <div class="links">
        <a href="/docs/" class="link">Docs Home</a>
        <a href="/docs/guide/quick-start" class="link">Quick Start</a>
        <a href="/docs/formats/krd" class="link">Formats</a>
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

.title {
  font-size: 4rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
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

.search-box {
  display: flex;
  gap: 8px;
  margin-bottom: 2rem;
}

.search-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: var(--vp-c-brand-1);
}

.search-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.search-btn:hover {
  opacity: 0.85;
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
  border-color: var(--vp-c-brand-1);
}
</style>
