"use client";

import { create } from "zustand";
import { GEMINI_CHAT_PREAMBLE } from "@/lib/ai/prompts";
import { parseSuggestionFromText as parseSuggestionPrimitive } from "@/lib/ai/suggestions";

export type ChatRole = "user" | "assistant" | "system";

export interface AISuggestion {
  lat: number;
  lng: number;
  title: string;
  description?: string;
  id?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  suggestion?: AISuggestion | null;
}

interface ChatState {
  isOpen: boolean;
  isLoading: boolean;
  messages: ChatMessage[];
  suggestions: AISuggestion[];
  error?: string | null;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setLoading: (loading: boolean) => void;
  setError: (message: string | null) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "createdAt"> & { id?: string; createdAt?: number }) => ChatMessage;
  addSuggestion: (suggestion: AISuggestion) => AISuggestion;
  clearSuggestions: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  isLoading: false,
  messages: [],
  suggestions: [],
  error: null,
  toggle: () =>
    set((state) => ({
      isOpen: !state.isOpen,
      error: null,
    })),
  open: () =>
    set(() => ({
      isOpen: true,
      error: null,
    })),
  close: () =>
    set(() => ({
      isOpen: false,
    })),
  setLoading: (loading) =>
    set(() => ({
      isLoading: loading,
    })),
  setError: (message) =>
    set(() => ({
      error: message,
    })),
  addMessage: (message) => {
    const enriched: ChatMessage = {
      id:
        message.id ??
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)),
      role: message.role,
      content: message.content,
      suggestion: message.suggestion,
      createdAt: message.createdAt ?? Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, enriched],
      ...(enriched.suggestion
        ? {
            suggestions: [
              ...state.suggestions,
              {
                ...enriched.suggestion,
                id:
                  enriched.suggestion.id ??
                  (typeof crypto !== "undefined" && "randomUUID" in crypto
                    ? crypto.randomUUID()
                    : enriched.id),
              },
            ],
          }
        : {}),
    }));

    return enriched;
  },
  addSuggestion: (suggestion) => {
    const enriched: AISuggestion = {
      ...suggestion,
      id:
        suggestion.id ??
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)),
    };
    set((state) => ({
      suggestions: [...state.suggestions, enriched],
    }));
    return enriched;
  },
  clearSuggestions: () =>
    set(() => ({
      suggestions: [],
    })),
  reset: () =>
    set(() => ({
      isOpen: false,
      isLoading: false,
      messages: [],
      suggestions: [],
      error: null,
    })),
}));

export const parseSuggestionFromText = (text: string): AISuggestion | null => {
  const parsed = parseSuggestionPrimitive(text);
  if (!parsed) return null;
  return {
    lat: parsed.lat,
    lng: parsed.lng,
    title: parsed.title ?? "AI Suggested Spot",
    description: parsed.description,
  };
};

export const buildPromptPreamble = (): string => GEMINI_CHAT_PREAMBLE;


