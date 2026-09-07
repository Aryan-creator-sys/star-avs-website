// ============================================================================
//  STAR AV ASSIST — server-side Gemini handler (LOCAL DEV ONLY).
//
//  This runs inside the Vite dev/preview server (Node). For production on
//  Hostinger the equivalent logic lives in public/api/chat.php (PHP proxy), so
//  the deployed static site needs no Node server. Both share the same grounding
//  context (src/lib/avassist/aiContext.js) and system prompt.
//
//  GEMINI_API_KEY is read from the server environment and never sent to the
//  browser. Memory: the frontend sends the full conversation each turn.
// ============================================================================

import { SYSTEM_PROMPT } from "../src/lib/avassist/systemPrompt.js";
import { buildCatalogSnapshot, OUTPUT_RULES, validProductIds, AI_DEFAULTS } from "../src/lib/avassist/aiContext.js";

export async function geminiChat({ messages = [], session = {} } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY is not configured");
    err.code = "no_key";
    throw err;
  }
  const model = process.env.GEMINI_MODEL || AI_DEFAULTS.model;

  const systemInstruction = [
    SYSTEM_PROMPT,
    "\nPRODUCT CATALOG (source of truth, JSON):\n" + JSON.stringify(buildCatalogSnapshot()),
    session && Object.keys(session).length ? "\nKNOWN CONTEXT so far (JSON):\n" + JSON.stringify(session) : "",
    "\nOUTPUT FORMAT:\n" + OUTPUT_RULES,
  ].join("\n");

  const contents = messages
    .filter((m) => m && m.content)
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: String(m.content) }] }));

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: {
      temperature: AI_DEFAULTS.temperature,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          intent: { type: "string" },
          response: { type: "string" },
          products: { type: "array", items: { type: "string" } },
          showProductCard: { type: "boolean" },
          showWhatsApp: { type: "boolean" },
        },
        required: ["intent", "response", "showProductCard"],
      },
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  // one retry on transient (5xx / network) failures — gemini-3.6-flash is a
  // thinking model and can occasionally hiccup under bursty load.
  let res, lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) break;
      if (res.status < 500) break; // a 4xx won't change on retry
    } catch (e) {
      lastErr = e;
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 600));
  }
  if (!res || !res.ok) {
    const detail = res ? (await res.text().catch(() => "")) : String(lastErr || "network error");
    const err = new Error(`Gemini API error ${res ? res.status : "network"}`);
    err.code = "api_error";
    err.status = res ? res.status : 0;
    err.detail = detail.slice(0, 300);
    throw err;
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { intent: "GENERAL_AV_QUESTION", response: text || "Sorry, could you rephrase that?", products: [], showProductCard: false };
  }
  const valid = new Set(validProductIds());
  const products = Array.isArray(parsed.products) ? parsed.products.filter((id) => valid.has(id)) : [];
  return {
    intent: parsed.intent || "OTHER",
    response: parsed.response || "",
    products,
    showProductCard: !!parsed.showProductCard && products.length > 0,
    showWhatsApp: !!parsed.showWhatsApp,
  };
}
