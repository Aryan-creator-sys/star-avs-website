import { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";

/** Scrollable message list + composer + typing indicator. */
export default function ChatInterface({ messages, typing, onAction, onSend, onClose }) {
  const [draft, setDraft] = useState("");
  const scroller = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  const submit = (e) => {
    e.preventDefault();
    const v = draft.trim();
    if (!v) return;
    setDraft("");
    onSend(v);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scroller}
        data-lenis-prevent
        className="flex-1 space-y-3.5 overflow-y-auto overscroll-contain px-4 py-4"
        style={{ scrollbarWidth: "thin" }}
      >
        {messages.map((m) => (
          <ChatMessage key={m.id} msg={m} onAction={onAction} onSend={onSend} onClose={onClose} />
        ))}
        {typing && (
          <div className="flex items-center gap-1.5 px-1" aria-live="polite" aria-label="STAR AV Assist is typing">
            <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="border-t border-white/10 bg-black/40 p-3">
        <div className="flex items-end gap-2">
          <label htmlFor="avassist-input" className="sr-only">Ask STAR AV Assist</label>
          <textarea
            id="avassist-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) submit(e);
            }}
            rows={1}
            placeholder="Ask about projectors, screens, audio, budget…"
            className="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-[0.85rem] text-white placeholder-white/35 outline-none transition-colors focus:border-white/30"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send message"
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#ff2e2e] text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

function Dot({ delay = "0s" }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-white/50"
      style={{ animation: "avassist-bounce 1s infinite ease-in-out", animationDelay: delay }}
    />
  );
}
