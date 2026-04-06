import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { createApp } from "./app";

const port = Number(process.env.PORT ?? 3001);
const origin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

const app = createApp({ middleware: [cors({ origin })] });

serve({ fetch: app.fetch, hostname: "127.0.0.1", port }, () => {
  console.log(`Garmin push dev server running at http://127.0.0.1:${port}`);
  console.log(`CORS origin: ${origin}`);
});
