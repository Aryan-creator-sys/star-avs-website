import { useCallback, useEffect, useRef, useState } from "react";
import AssistantLauncher from "./AssistantLauncher";
import AssistantPanel from "./AssistantPanel";
import { greeting, actionToInput } from "../../lib/avassist/engine";
import { extractEntities } from "../../lib/avassist/parse";
import { chatWithBackend } from "../../lib/avassist/client";
import { PROJECTORS } from "../../data/avProducts";

/**
 * STAR AV ASSIST — root.
 *
 * Gemini is the brain. Every ordinary user message is sent, unmodified, to the
 * backend (/api/chat.php → Gemini) together with the full conversation history
 * and accumulated context. Gemini classifies intent, reasons, and writes the
 * reply; the frontend just renders it and shows product cards only when Gemini
 * says a card is relevant.
 *
 * There is NO hardcoded answer path: the app never intercepts a user message and
 * substitutes a canned reply. The only pre-written content is the initial
 * welcome/menu (shown once, on open) and an honest ERROR state if the AI call
 * genuinely fails — never a fake "answer".
 */
let _id = 0;
const nextId = () => `m${++_id}`;

export default function AVAssistant() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const session = useRef({}); // accumulated context passed to Gemini for memory
  const history = useRef([]); // {role:'user'|'assistant', content} sent every turn

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openPanel = useCallback(() => {
    setOpen(true);
    // welcome/menu is the INITIAL STATE ONLY — never a reply to a real message
    setMessages((prev) => (prev.length ? prev : [{ id: nextId(), role: "assistant", blocks: greeting() }]));
  }, []);
  const closePanel = useCallback(() => setOpen(false), []);

  const productBlocksFromIds = (ids) => {
    const items = (ids || [])
      .map((id) => PROJECTORS.find((p) => p.id === id))
      .filter(Boolean)
      .map((product) => ({ tier: "RECOMMENDED", product, reason: product.notes }));
    return items.length ? [{ type: "products", items }] : [];
  };

  // Send a real user message to Gemini. `parseText` is what Gemini receives;
  // `displayText` is what we show in the user's bubble (same, except for chips).
  const send = useCallback((parseText, displayText) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text: displayText }]);
    history.current = [...history.current, { role: "user", content: parseText }];
    // accumulate lightweight context (room/screen/budget/…) to help Gemini remember
    session.current = { ...session.current, ...extractEntities(parseText) };
    setTyping(true);

    (async () => {
      try {
        const data = await chatWithBackend(history.current, session.current);
        const text = (data && data.response) || "";
        const blocks = [{ type: "text", text }];
        if (data && data.showProductCard) blocks.push(...productBlocksFromIds(data.products));
        // Gemini decided the user needs the team → show the direct WhatsApp
        // contact (a link the user chooses to use; nothing is sent for them).
        if (data && data.showWhatsApp) blocks.push({ type: "escalation", text: "" });
        history.current = [...history.current, { role: "assistant", content: text }];
        setTyping(false);
        setMessages((prev) => [...prev, { id: nextId(), role: "assistant", blocks }]);
      } catch (e) {
        // Honest error state — NOT a fake answer, and NOT a hardcoded reply.
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            error: true,
            blocks: [
              { type: "text", text: "Sorry — I couldn't reach the AV assistant just now. Please try again in a moment, or reach our team directly:" },
              { type: "escalation", text: "" },
            ],
          },
        ]);
      }
    })();
  }, []);

  const onSend = useCallback((text) => {
    const v = (text || "").trim();
    if (v) send(v, v);
  }, [send]);

  // Quick-action chips are conversation STARTERS: their text is sent to Gemini
  // like any user message (not mapped to a canned response).
  const onAction = useCallback((id, label) => {
    const resolved = actionToInput(id);
    send(resolved.text || id, label || resolved.text || id);
  }, [send]);

  return (
    <>
      {!open && scrolled && <AssistantLauncher onOpenAssist={openPanel} />}
      {open && (
        <AssistantPanel messages={messages} typing={typing} onAction={onAction} onSend={onSend} onClose={closePanel} />
      )}
    </>
  );
}
