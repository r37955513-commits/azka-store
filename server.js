import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { createRequestHandler } from "react-router";

/**
 * خادم Hono لأذكى متجر.
 * - يخدم الملفات الثابتة من build/client
 * - يوفّر مسارات API إضافية تحت /api (مثل webhook واتساب)
 * - يمرّر بقية الطلبات إلى React Router (SSR)
 */

const app = new Hono();
app.use("*", logger());

const api = new Hono();

api.get("/health", (c) => c.json({ status: "ok", store: "أذكى متجر" }));

api.get("/whatsapp/webhook", (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return c.text(challenge ?? "");
  }
  return c.text("forbidden", 403);
});

api.post("/whatsapp/webhook", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  console.log("[whatsapp webhook]", JSON.stringify(body));
  return c.json({ received: true });
});

app.route("/api", api);

app.use("/assets/*", serveStatic({ root: "./build/client" }));
app.use("/uploads/*", serveStatic({ root: "./public" }));
app.use("/favicon.ico", serveStatic({ path: "./build/client/favicon.ico" }));

const build = await import("./build/server/index.js");
const handler = createRequestHandler(build, process.env.NODE_ENV);

app.all("*", async (c) => {
  return handler(c.req.raw, {});
});

const port = Number(process.env.PORT || 3000);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`🚀 أذكى متجر يعمل على http://localhost:${info.port}`);
});
