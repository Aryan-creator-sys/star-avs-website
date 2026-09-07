import AssistantHeader from "./AssistantHeader";
import ChatInterface from "./ChatInterface";

/**
 * Floating consultation panel. Desktop: compact card anchored bottom-right.
 * Mobile: polished full-screen experience (respecting safe-area insets).
 */
export default function AssistantPanel({ messages, typing, onAction, onSend, onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="STAR AV Assist consultant"
      className="fixed inset-0 z-[95] flex flex-col overflow-hidden border-white/10 bg-[#0b0b0e]/95 text-white shadow-2xl backdrop-blur-xl
                 supports-[backdrop-filter]:bg-[#0b0b0e]/80
                 sm:inset-auto sm:bottom-[calc(1.25rem+env(safe-area-inset-bottom))] sm:right-5 sm:h-[min(620px,80vh)] sm:w-[400px] sm:rounded-2xl sm:border"
      style={{ animation: "avassist-panel-in 0.32s cubic-bezier(0.22,0.61,0.36,1)" }}
    >
      <AssistantHeader onClose={onClose} />
      <ChatInterface messages={messages} typing={typing} onAction={onAction} onSend={onSend} onClose={onClose} />
    </div>
  );
}
