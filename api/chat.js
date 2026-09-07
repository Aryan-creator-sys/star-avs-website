// ============================================================================
//  STAR AV ASSIST — Vercel serverless function (production backend).
//
//  Mirrors the local Vite dev middleware (vite.config.js -> avAssistApi) by
//  reusing the SAME server-side handler, so behaviour is identical everywhere:
//    · local dev/preview  -> Vite middleware  (/api/chat*)
//    · Hostinger          -> public/api/chat.php
//    · Vercel             -> this function     (/api/chat, aliased from
//                             /api/chat.php via the rewrite in vercel.json)
//
//  GEMINI_API_KEY is read from the server environment (set it in the Vercel
//  project settings) and is never bundled into the client.
// ============================================================================

import { geminiChat } from "../server/geminiChat.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "method_not_allowed" }));
  }
  try {
    // Vercel may already parse JSON bodies; accept both parsed and raw.
    const payload =
      req.body && typeof req.body === "object"
        ? req.body
        : JSON.parse(typeof req.body === "string" && req.body ? req.body : "{}");
    const result = await geminiChat(payload);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(result));
  } catch (e) {
    // never leak keys / stack traces to the client (same contract as dev)
    const status = e && e.code === "no_key" ? 503 : 502;
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: e && e.code === "no_key" ? "gemini_not_configured" : "ai_unavailable" }));
  }
}
