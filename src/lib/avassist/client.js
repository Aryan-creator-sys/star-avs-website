// Talks to the secure /api/chat backend (Gemini lives server-side).
// Throws on any non-OK response so the caller can fall back to the local engine.
// Production endpoint is a PHP proxy on Hostinger (/api/chat.php). In local dev
// the Vite middleware also matches this path, so one URL works in both places.
export async function chatWithBackend(messages, session) {
  const res = await fetch("/api/chat.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, session }),
  });
  if (!res.ok) {
    const err = new Error("backend_unavailable");
    err.status = res.status;
    try { err.body = await res.json(); } catch { /* ignore */ }
    throw err;
  }
  return res.json();
}
