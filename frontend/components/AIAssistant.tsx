"use client";

import { FormEvent, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Bot, Loader2, MessageSquareText, SendHorizontal, X } from "lucide-react";
import { AssistantMessage, askAssistant } from "@/lib/api";

export function AIAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content: "Hi, I can help with ASTRA workflows, property search, finance estimates, documents, tours, negotiation, and setup.",
    },
  ]);
  const [configured, setConfigured] = useState(false);
  const [model, setModel] = useState<string | null>(null);

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
        context: currentContext(pathname),
        history: nextMessages.slice(-8),
      });
      setConfigured(reply.configured);
      setModel(reply.model || null);
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
          "fixed bottom-5 right-5 z-[1200] flex items-center gap-2 rounded-lg bg-coral px-4 py-3 text-sm font-black text-white shadow-crisp transition hover:-translate-y-0.5",
          open && "hidden"
        )}
      >
        <MessageSquareText size={18} />
        AI assistant
      </button>

      {open && (
        <section className="fixed bottom-5 right-5 z-[1200] flex h-[560px] w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-lg border border-ink/15 bg-[#fffaf0] shadow-soft">
          <header className="flex items-center justify-between border-b border-ink/15 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-ink text-[#fffaf0]">
                <Bot size={18} />
              </div>
              <div>
                <p className="font-display text-lg font-black text-ink">ASTRA AI Assistant</p>
                <p className="section-kicker">{configured ? `Live — ${model ?? "gemini"}` : "Demo assistant"}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-md text-ink/50 hover:bg-ink/8">
              <X size={17} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-auto bg-[linear-gradient(90deg,rgba(25,23,19,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(25,23,19,0.04)_1px,transparent_1px)] bg-[length:24px_24px] p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={clsx(
                  "max-w-[88%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-6",
                  message.role === "user"
                    ? "ml-auto bg-ink text-[#fffaf0]"
                    : "bg-white/82 text-ink/70 ring-1 ring-ink/12"
                )}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-white/82 px-3 py-2 text-sm text-ink/52 ring-1 ring-ink/12">
                <Loader2 size={15} className="animate-spin" />
                Thinking
              </div>
            )}
          </div>

          <form onSubmit={submit} className="border-t border-ink/15 p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about search, finance, docs, tours, or setup..."
                className="max-h-28 min-h-11 flex-1 resize-none rounded-md border border-ink/15 bg-white/68 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-coral"
              />
              <button disabled={loading || !input.trim()} className="grid h-11 w-11 place-items-center rounded-md bg-coral text-white disabled:opacity-50">
                <SendHorizontal size={17} />
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}

function currentContext(pathname: string) {
  // usePathname() returns the route without basePath, so "/" works on GitHub
  // Pages too (where window.location.pathname is "/AIRealEstate/").
  if (pathname === "/") return "home";
  if (typeof window === "undefined") return "workspace";
  return new URLSearchParams(window.location.search).get("tab") || "workspace";
}
