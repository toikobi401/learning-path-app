"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";

type Goal = { id: string; title: string; level: string; status: string; learning_path: { id: string } | null };
type Message = { id?: string; role: "user" | "assistant"; content: string; created_at?: string };

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? "rounded-br-sm bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" : "rounded-bl-sm bg-white text-gray-800 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700"}`}>
        {message.content}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const ct = t.chat;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    async function loadGoals() {
      const res = await fetch("/api/goals");
      if (res.ok) {
        const data = await res.json() as Goal[];
        setGoals(data);
        const paramGoalId = searchParams.get("goalId");
        const preferred = data.find((g) => g.id === paramGoalId) ?? data[0];
        if (preferred) setSelectedGoalId(preferred.id);
      }
      setLoadingGoals(false);
    }
    loadGoals();
  }, []);

  const loadMessages = useCallback(async (goalId: string) => {
    if (!goalId) return;
    setLoadingMessages(true);
    const res = await fetch(`/api/goals/${goalId}/messages`);
    if (res.ok) setMessages(await res.json());
    setLoadingMessages(false);
  }, []);

  useEffect(() => {
    if (selectedGoalId) { setMessages([]); loadMessages(selectedGoalId); }
  }, [selectedGoalId, loadMessages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending || !selectedGoalId) return;
    setInput(""); setSending(true);
    const userMessage: Message = { role: "user", content: text };
    const streamingMessage: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, userMessage, streamingMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: selectedGoalId, message: text }),
      });
      if (!res.ok || !res.body) {
        setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: ct.errorGeneral }]);
        setSending(false); return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: accumulated }]);
      }
    } catch {
      setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: ct.errorConnection }]);
    }
    setSending(false);
  }

  async function clearChat() {
    if (!selectedGoalId || clearingChat) return;
    setClearingChat(true);
    const res = await fetch(`/api/goals/${selectedGoalId}/messages`, { method: "DELETE" });
    if (res.ok) setMessages([]);
    setClearingChat(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  return (
    <div className="flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-4 flex-none">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{ct.title}</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{ct.subtitle}</p>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} disabled={clearingChat} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
              {clearingChat ? ct.clearing : ct.clearHistory}
            </button>
          )}
        </div>
      </div>

      {loadingGoals ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100" />
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ct.noGoals}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{ct.noGoalsDesc}</p>
            <Link href="/dashboard/goals/new" className="mt-4 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900">
              {ct.createGoal}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 flex-none">
            <select value={selectedGoalId} onChange={(e) => setSelectedGoalId(e.target.value)} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-gray-100">
              {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
            {loadingMessages ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ct.startConversation}</p>
                  <p className="mt-1 max-w-xs text-xs text-gray-500 dark:text-gray-400">{ct.startConversationDesc}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {ct.suggestions.map((prompt) => (
                    <button key={prompt} onClick={() => { setInput(prompt); textareaRef.current?.focus(); }} className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition hover:bg-white dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, i) => <MessageBubble key={msg.id ?? i} message={msg} />)}
                {sending && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content === "" && (
                  <div className="flex justify-start">
                    <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="mt-3 flex-none">
            <div className="flex items-end gap-2 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
              <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={ct.placeholder} rows={1}
                className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder-gray-500" style={{ maxHeight: "120px" }} />
              <button onClick={sendMessage} disabled={!input.trim() || sending} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-900 text-white transition hover:bg-gray-700 disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-right text-xs text-gray-400 dark:text-gray-600">{ct.poweredBy}</p>
          </div>
        </>
      )}
    </div>
  );
}
