import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { geminiChat } from "./server/geminiChat.js";
import { SYSTEM_PROMPT } from "./src/lib/avassist/systemPrompt.js";
import { buildCatalogSnapshot, OUTPUT_RULES, validProductIds, AI_DEFAULTS } from "./src/lib/avassist/aiContext.js";

// Emit dist/api/ai-context.json at build time (read by the Hostinger PHP proxy).
// Keeps the catalog + prompt in sync with the source of truth automatically.
function aiContextEmitter() {
  return {
    name: "ai-context-emitter",
    generateBundle() {
      const ctx = {
        systemPrompt: SYSTEM_PROMPT,
        outputRules: OUTPUT_RULES,
        catalog: buildCatalogSnapshot(),
        validProductIds: validProductIds(),
        defaults: AI_DEFAULTS,
      };
      this.emitFile({ type: "asset", fileName: "api/ai-context.json", source: JSON.stringify(ctx) });
    },
  };
}

// Minimal secure API middleware: exposes POST /api/chat in dev & preview.
// The GEMINI_API_KEY stays server-side (never bundled into client code).
function avAssistApi() {
  const handler = async (req, res, next) => {
    if (!req.url || !req.url.startsWith("/api/chat") || req.method !== "POST") return next();
    try {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const payload = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      const result = await geminiChat(payload);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(result));
    } catch (e) {
      console.error("[av-assist]", e && e.status, (e && (e.detail || e.message)) || e);
      const status = e && e.code === "no_key" ? 503 : 502;
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      // never leak keys / stack traces to the client
      res.end(JSON.stringify({ error: e && e.code === "no_key" ? "gemini_not_configured" : "ai_unavailable" }));
    }
  };
  return {
    name: "av-assist-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(({ mode }) => {
  // load .env (non-VITE_ vars too) into process.env for the server middleware
  const env = loadEnv(mode, process.cwd(), "");
  if (env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (env.GEMINI_MODEL && !process.env.GEMINI_MODEL) process.env.GEMINI_MODEL = env.GEMINI_MODEL;
  return {
    plugins: [react(), avAssistApi(), aiContextEmitter()],
    server: { port: 5178, host: true },
  };
});
