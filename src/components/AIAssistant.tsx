/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { Bot, Send, User, Sparkles, Brain, Zap, Loader2, ArrowRight } from "lucide-react";
import { auth } from "../firebase";

interface Props {
  onTrackAction: (actionType: string) => void;
}

export default function AIAssistant({ onTrackAction }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "👋 Welcome! I am your AI Principal Electrical Engineer. Ask me anything about single or three-phase load balancing, cable sizing directives, conduit fill occupancy limits, or localized code rules (AU: AS/NZS 3000, UK: BS 7671, USA: NEC NFPA 70).",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isHighThinking, setIsHighThinking] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendChat = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text || loading) return;

    if (!textToSend) {
      setInputValue("");
    }

    const newUserMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);

    try {
      let token = "guest-bypass-token";
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch (e) {
          console.error("Token fetch failed:", e);
        }
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          previousMessages: messages,
          isHighThinking: isHighThinking,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.text },
        ]);
        onTrackAction("chat_usage");
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠ [Error]: ${data.error || "The AI model encountered a loading exception. Please try again."}`,
          },
        ]);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ [Offline / Connections Error]: Unable to communicate with the server-side Gemini service. Please verify your internet connections.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const setChatSuggested = (msg: string) => {
    handleSendChat(msg);
  };

  return (
    <div className="bg-white dark:bg-slate-850 rounded-xl border border-slate-105 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col h-[520px]">
      {/* Header with control toggles */}
      <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-b border-slate-105 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              AI Design Assistant
            </h3>
            <span className="text-3xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" /> Powered by Gemini 3.5 &amp; 3.1
            </span>
          </div>
        </div>

        {/* Model intelligence setting */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setIsHighThinking(false)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-3xs font-bold transition cursor-pointer ${
              !isHighThinking
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-700"
            }`}
          >
            <Zap className="w-3 h-3" /> Low Latency
          </button>
          <button
            onClick={() => setIsHighThinking(true)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-3xs font-bold transition cursor-pointer ${
              isHighThinking
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-990/30 dark:text-emerald-400 border-emerald-300"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-700"
            }`}
          >
            <Brain className="w-3 h-3" /> High Thinking
          </button>
        </div>
      </div>

      {/* Messages Canvas */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/30 scrollbar">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 max-w-[85%] ${
              m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                m.role === "user"
                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 text-amber-700 dark:text-amber-400"
                  : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 text-emerald-700 dark:text-emerald-400"
              }`}
            >
              {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed border shadow-xs whitespace-pre-line ${
                m.role === "user"
                  ? "bg-amber-50/70 border-amber-100 text-slate-800 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-slate-200 rounded-tr-none"
                  : "bg-white border-slate-105 text-slate-800 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-100 rounded-tl-none font-medium"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 mr-auto max-w-[85%]">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border bg-emerald-50 border-emerald-100 text-emerald-700">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border-slate-105 dark:bg-slate-850 dark:border-slate-800 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-slate-500 shadow-xs border">
              <Loader2 className="w-3.5 h-3.5 text-emerald-650 animate-spin" />
              <span>
                {isHighThinking
                  ? "Pondering thermal coefficients and compliance tables..."
                  : "Drafting response..."}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts list */}
      <div className="px-4 py-2 bg-white dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 overflow-x-auto whitespace-nowrap scrollbar flex gap-2">
        <button
          onClick={() =>
            setChatSuggested("Design a commercial kitchen circuit 16kW at 240V, single-phase for USA")
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-3xs font-semibold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition bg-slate-50 dark:bg-slate-800 cursor-pointer shrink-0"
        >
          <span>USA Kitchen 16kW</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </button>
        <button
          onClick={() =>
            setChatSuggested("What is the derating coefficient for 5 grouped XLPE circuits in 40C ambient temperature?")
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-3xs font-semibold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition bg-slate-50 dark:bg-slate-800 cursor-pointer shrink-0"
        >
          <span>Thermal Derating</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </button>
        <button
          onClick={() => setChatSuggested("Can you explain BS 7671 grounding systems (TN-S, TN-C-S and TT)?")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-3xs font-semibold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition bg-slate-50 dark:bg-slate-800 cursor-pointer shrink-0"
        >
          <span>UK Earthing types</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </button>
        <button
          onClick={() =>
            setChatSuggested("Check conduit fill standard for 6 cables of 12mm OD inside 50mm PVC conduit")
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-3xs font-semibold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition bg-slate-50 dark:bg-slate-800 cursor-pointer shrink-0"
        >
          <span>Conduit fill check</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Inputs block */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-105 dark:border-slate-800 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="e.g. Size cable for 95A load in UK continuous commercial..."
          onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
          className="flex-1 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 text-xs px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 dark:text-slate-100"
        />
        <button
          onClick={() => handleSendChat()}
          disabled={loading || !inputValue.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2 rounded-lg flex items-center justify-center transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
