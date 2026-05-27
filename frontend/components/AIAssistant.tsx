"use client";

import { FormEvent, useState } from "react";
import clsx from "clsx";
import { Bot, Loader2, MessageSquareText, SendHorizontal, X } from "lucide-react";
import { AssistantMessage, askAssistant } from "@/lib/api";

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content: "Hi, I can help with ASTRA workflows, property search, finance estimates, documents, tours, negotiation, and setup.",
    },
  ]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: AssistantMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const reply = await askAssistant({
        message: text,
        context: currentContext(),
        history: nextMessages.slice(-8),
      });
      const suffix = reply.configured ? "" : "\n\nConfigure GEMINI_API_KEY in the root .env file for full LLM responses.";
      setMessages([...nextMessages, { role: "assistant", content: `${reply.answer}${suffix}` }]);
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "I could not reach the assistant service. Check that the FastAPI backend is running on the configured API URL." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          "fixed bottom-5 right-5 z-[1200] flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-2xl transition hover:bg-slate-800",
          open && "hidden"
        )}
      >
        <MessageSquareText size={18} />
        AI assistant
      </button>

      {open && (
        <section className="fixed bottom-5 right-5 z-[1200] flex h-[560px] w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-slate-950 text-white">
                <Bot size={18} />
              </div>
              <div>
                <p className="font-black text-slate-950">ASTRA AI Assistant</p>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-estate-700">Gemini-ready</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100">
              <X size={17} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-auto bg-slate-50 p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={clsx(
                  "max-w-[88%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-6",
                  message.role === "user"
                    ? "ml-auto bg-slate-950 text-white"
                    : "bg-white text-slate-700 ring-1 ring-slate-200"
                )}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-500 ring-1 ring-slate-200">
                <Loader2 size={15} className="animate-spin" />
                Thinking
              </div>
            )}
          </div>

          <form onSubmit={submit} className="border-t border-slate-200 p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about search, finance, docs, tours, or setup..."
                className="max-h-28 min-h-11 flex-1 resize-none rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-estate-500"
              />
              <button disabled={loading || !input.trim()} className="grid h-11 w-11 place-items-center rounded-md bg-estate-700 text-white disabled:opacity-50">
                <SendHorizontal size={17} />
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}

function currentContext() {
  if (typeof window === "undefined") return "workspace";
  if (window.location.pathname === "/") return "home";
  return new URLSearchParams(window.location.search).get("tab") || "workspace";
}
