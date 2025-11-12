"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AISuggestion,
  ChatMessage,
  parseSuggestionFromText,
  useChatStore,
} from "@/stores/useChatStore";

interface ChatWidgetProps {
  className?: string;
  onSuggestion?: (suggestion: AISuggestion) => void;
}

export function ChatWidget({ className, onSuggestion }: ChatWidgetProps) {
  const isOpen = useChatStore((state) => state.isOpen);
  const toggle = useChatStore((state) => state.toggle);
  const close = useChatStore((state) => state.close);
  const messages = useChatStore((state) => state.messages);
  const isLoading = useChatStore((state) => state.isLoading);
  const error = useChatStore((state) => state.error);
  const addMessage = useChatStore((state) => state.addMessage);
  const setLoading = useChatStore((state) => state.setLoading);
  const setError = useChatStore((state) => state.setError);

  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasMessages = messages.length > 0;

  const scrollToBottom = () => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  };

  useEffect(() => {
    if (isOpen) {
      const timeout = requestAnimationFrame(scrollToBottom);
      return () => cancelAnimationFrame(timeout);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const canSend = input.trim().length > 0 && !isLoading;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;

    const trimmed = input.trim();
    setInput("");
    setError(null);

    addMessage({
      role: "user",
      content: trimmed,
      suggestion: null,
    });

    const payloadMessages = useChatStore
      .getState()
      .messages.map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      }));

    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: payloadMessages,
        }),
      });

      if (!res.ok) {
        const problem = await res.json().catch(() => ({}));
        // Extract user-friendly error message from API response
        const errorMessage = problem.error || "Failed to reach AI service";
        throw new Error(errorMessage);
      }

      const data = await res.json();
      const text: string = data.message ?? "";
      const suggestionFromPayload: AISuggestion | null =
        data.suggestion && data.suggestion.lat && data.suggestion.lng
          ? {
              lat: data.suggestion.lat,
              lng: data.suggestion.lng,
              title: data.suggestion.title ?? "AI Suggested Spot",
              description: data.suggestion.description,
            }
          : null;

      const fallbackSuggestion = suggestionFromPayload ?? parseSuggestionFromText(text);
      const assistantMessage = addMessage({
        role: "assistant",
        content: text,
        suggestion: fallbackSuggestion,
      });

      if (fallbackSuggestion && onSuggestion) {
        onSuggestion({
          ...fallbackSuggestion,
          id: assistantMessage.id,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      // Show the user-friendly error message from the API
      addMessage({
        role: "assistant",
        content: message.includes("busy") || message.includes("overloaded")
          ? message
          : "Sorry, I ran into an error while planning. Please try again in a moment.",
        suggestion: null,
      });
    } finally {
      setLoading(false);
      requestAnimationFrame(scrollToBottom);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === "user";
    const suggestion = message.suggestion;
    return (
      <div
        key={message.id}
        className={cn(
          "flex w-full text-sm",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm transition-colors",
            isUser
              ? "bg-brand-600 text-white"
              : "bg-gray-800 text-gray-100 border border-gray-700"
          )}
        >
          <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
          {suggestion && (
            <div className="mt-3 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-gray-300">
              <div className="font-semibold text-gray-100">{suggestion.title}</div>
              {suggestion.description && <div className="mt-1">{suggestion.description}</div>}
              <div className="mt-2 text-[11px] uppercase tracking-wide text-brand-300">
                Tap the glowing pin on the map to create this activity ✨
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className={cn(
          "fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-gray-900 md:bottom-8 md:right-8",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className={cn(
              "fixed inset-x-0 bottom-0 top-auto z-[70] mx-auto flex h-[min(80vh,520px)] w-full max-w-none flex-col border border-gray-800 bg-gray-950/95 text-gray-100 shadow-2xl backdrop-blur",
              "md:bottom-28 md:right-8 md:left-auto md:h-[520px] md:w-[380px] md:max-w-[380px] md:rounded-3xl md:border md:bg-gray-950/90",
              className
            )}
          >
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-brand-200">
                  Chat to Plan
                </div>
                <div className="text-xs text-gray-400">Powered by Gemini</div>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-800 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
              ref={scrollerRef}
              className={cn(
                "flex-1 space-y-4 overflow-y-auto px-4 py-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700",
                !hasMessages && "items-center justify-center text-center text-sm text-gray-400"
              )}
            >
              {hasMessages ? (
                messages.map(renderMessage)
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-gray-400">
                  <MessageCircle className="h-10 w-10 text-brand-400" />
                  <div className="text-sm font-medium text-gray-200">
                    Ask Gemini for inspiration
                  </div>
                  <p className="max-w-xs text-xs">
                    Try: <span className="font-semibold text-brand-300">“Find me a cool outdoor activity near Tunis under $20.”</span>
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="px-4 text-xs text-red-400">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="border-t border-gray-800 p-4"
            >
              <div className="flex items-end gap-3 rounded-2xl border border-gray-800 bg-gray-900/70 px-3 py-2 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Where should we explore next?"
                  className="min-h-[48px] flex-1 resize-none bg-transparent text-sm text-gray-100 outline-none placeholder:text-gray-500"
                  rows={1}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


