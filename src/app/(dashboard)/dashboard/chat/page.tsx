"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";

type Conversation = {
  id: string;
  title: string;
  goal_id: string | null;
  goal_title: string | null;
  last_message: { content: string; role: string; created_at: string } | null;
  updated_at: string;
  created_at: string;
};

type Message = { role: "user" | "assistant"; content: string };

type Goal = { id: string; title: string };

function groupConversations(
  conversations: Conversation[],
  labels: { today: string; yesterday: string; last7days: string; older: string }
) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const sevenDaysStart = new Date(todayStart.getTime() - 6 * 86400000);

  const groups: { label: string; items: Conversation[] }[] = [
    { label: labels.today, items: [] },
    { label: labels.yesterday, items: [] },
    { label: labels.last7days, items: [] },
    { label: labels.older, items: [] },
  ];

  for (const c of conversations) {
    const d = new Date(c.updated_at);
    if (d >= todayStart) groups[0].items.push(c);
    else if (d >= yesterdayStart) groups[1].items.push(c);
    else if (d >= sevenDaysStart) groups[2].items.push(c);
    else groups[3].items.push(c);
  }

  return groups.filter((g) => g.items.length > 0);
}

export default function ChatPage() {
  const { t } = useLanguage();
  const ct = t.conversations;
  const searchParams = useSearchParams();
  const urlGoalId = searchParams.get("goalId");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // New chat modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [creatingConv, setCreatingConv] = useState(false);

  // Rename
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;

  useEffect(() => {
    const init = async () => {
      // Load goals list
      const goalsRes = await fetch("/api/goals");
      if (goalsRes.ok) {
        const d = (await goalsRes.json()) as Goal[];
        setGoals(Array.isArray(d) ? d : []);
      }

      // Load conversations
      const convRes = await fetch("/api/conversations");
      if (!convRes.ok) { setLoadingConvs(false); return; }
      const data = (await convRes.json()) as { conversations: Conversation[] };
      setConversations(data.conversations);

      if (urlGoalId) {
        // Find existing conversation for this goal, or create one
        const existing = data.conversations.find((c) => c.goal_id === urlGoalId);
        if (existing) {
          setActiveConvId(existing.id);
        } else {
          // Create new conversation linked to this goal
          const createRes = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ goal_id: urlGoalId }),
          });
          if (createRes.ok) {
            const created = (await createRes.json()) as { conversation: Conversation };
            setConversations((prev) => [created.conversation, ...prev]);
            setActiveConvId(created.conversation.id);
          } else if (data.conversations.length > 0) {
            setActiveConvId(data.conversations[0].id);
          }
        }
      } else if (data.conversations.length > 0) {
        setActiveConvId(data.conversations[0].id);
      }

      setLoadingConvs(false);
    };
    init();
  }, [urlGoalId]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) { setMessages([]); return; }
    setLoadingMessages(true);
    fetch(`/api/conversations/${activeConvId}/messages`)
      .then(async (r) => {
        if (r.ok) {
          const d = (await r.json()) as { messages: Message[] };
          setMessages(d.messages ?? []);
        }
      })
      .finally(() => setLoadingMessages(false));
  }, [activeConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || streaming) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setStreaming(true);

    let resolvedConvId = activeConvId;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          conversationId: resolvedConvId ?? undefined,
          goalId: activeConv?.goal_id ?? undefined,
        }),
      });

      if (!res.ok || !res.body) {
        setMessages((prev) => [...prev, { role: "assistant", content: t.chat.errorGeneral }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      let firstChunk = true;

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        // Parse conversation ID from first chunk
        if (firstChunk) {
          firstChunk = false;
          const convIdMatch = chunk.match(/^\[CONV_ID:([^\]]+)\]\n/);
          if (convIdMatch) {
            const newConvId = convIdMatch[1];
            resolvedConvId = newConvId;
            if (!activeConvId) setActiveConvId(newConvId);
            const rest = chunk.slice(convIdMatch[0].length);
            if (rest) {
              assistantText += rest;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantText };
                return updated;
              });
            }
            continue;
          }
        }

        assistantText += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantText };
          return updated;
        });
      }

      // Refresh conversation list (title may have been auto-set)
      const refreshRes = await fetch("/api/conversations");
      if (refreshRes.ok) {
        const refreshData = (await refreshRes.json()) as { conversations: Conversation[] };
        setConversations(refreshData.conversations);
        if (resolvedConvId) setActiveConvId(resolvedConvId);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: t.chat.errorConnection }]);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Create new conversation
  const handleCreateConv = async () => {
    setCreatingConv(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal_id: selectedGoalId || undefined }),
      });
      if (res.ok) {
        const d = (await res.json()) as { conversation: Conversation };
        setConversations((prev) => [d.conversation, ...prev]);
        setActiveConvId(d.conversation.id);
        setMessages([]);
        setShowNewModal(false);
        setSelectedGoalId("");
      }
    } finally {
      setCreatingConv(false);
    }
  };

  const startRename = (conv: Conversation) => {
    setRenamingId(conv.id);
    setRenameValue(conv.title);
  };

  const submitRename = async (id: string) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: renameValue.trim() }),
    });
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: renameValue.trim() } : c))
    );
    setRenamingId(null);
  };

  const confirmDelete = async (id: string) => {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    if (activeConvId === id) {
      setActiveConvId(remaining[0]?.id ?? null);
      setMessages([]);
    }
    setDeletingId(null);
  };

  const groups = groupConversations(conversations, {
    today: ct.today,
    yesterday: ct.yesterday,
    last7days: ct.last7days,
    older: ct.older,
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-200 overflow-hidden flex-shrink-0 border-r border-neutral-200 dark:border-neutral-700 flex flex-col bg-neutral-50 dark:bg-neutral-900`}
      >
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setShowNewModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {ct.newChat}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loadingConvs ? (
            <div className="px-3 py-4 text-sm text-neutral-500">{t.common.loading}</div>
          ) : conversations.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-sm text-neutral-500">{ct.noConversations}</p>
              <p className="text-xs text-neutral-400 mt-1">{ct.noConversationsDesc}</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label}>
                <div className="px-3 py-1 text-xs font-medium text-neutral-400 uppercase tracking-wide">
                  {group.label}
                </div>
                {group.items.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isActive={conv.id === activeConvId}
                    isRenaming={renamingId === conv.id}
                    renameValue={renameValue}
                    onRenameChange={setRenameValue}
                    onSelect={() => setActiveConvId(conv.id)}
                    onStartRename={() => startRename(conv)}
                    onSubmitRename={() => submitRename(conv.id)}
                    onDelete={() => setDeletingId(conv.id)}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {activeConv ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">
                {activeConv.title || ct.untitled}
              </span>
              {activeConv.goal_title && (
                <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {ct.goalBadge} {activeConv.goal_title}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-neutral-500">{t.chat.title}</span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {!activeConvId ? (
            <EmptyState t={t} onSuggestion={(s) => { setInput(s); inputRef.current?.focus(); }} />
          ) : loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState t={t} onSuggestion={(s) => { setInput(s); inputRef.current?.focus(); }} />
          ) : (
            <>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-sm"
                    }`}
                  >
                    {m.content || (
                      <span className="inline-block w-2 h-4 bg-current opacity-70 animate-pulse" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.chat.placeholder}
              rows={1}
              disabled={streaming}
              className="flex-1 resize-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 min-h-[42px] max-h-32"
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 128) + "px";
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            >
              {streaming ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-neutral-400 mt-1.5 text-center">{t.chat.poweredBy}</p>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-4">{ct.newChat}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                {ct.selectGoal}
              </label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm"
              >
                <option value="">{ct.noGoal}</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowNewModal(false); setSelectedGoalId(""); }}
                className="flex-1 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleCreateConv}
                disabled={creatingConv}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {creatingConv ? t.common.loading : ct.newChatTitle}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4">{ct.deleteConfirm}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={() => confirmDelete(deletingId)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
              >
                {t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  t,
  onSuggestion,
}: {
  t: ReturnType<typeof useLanguage>["t"];
  onSuggestion: (s: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <p className="font-medium text-neutral-800 dark:text-neutral-200">{t.chat.startConversation}</p>
      <p className="text-sm text-neutral-500 mt-1 max-w-xs">{t.chat.startConversationDesc}</p>
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {t.chat.suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="text-xs px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConversationItem({
  conv,
  isActive,
  isRenaming,
  renameValue,
  onRenameChange,
  onSelect,
  onStartRename,
  onSubmitRename,
  onDelete,
}: {
  conv: Conversation;
  isActive: boolean;
  isRenaming: boolean;
  renameValue: string;
  onRenameChange: (v: string) => void;
  onSelect: () => void;
  onStartRename: () => void;
  onSubmitRename: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`group relative mx-2 my-0.5 rounded-lg cursor-pointer flex items-center gap-2 px-3 py-2 transition-colors ${
        isActive
          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
          : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { if (!isRenaming) onSelect(); }}
    >
      {isRenaming ? (
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onBlur={onSubmitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmitRename();
            if (e.key === "Escape") onRenameChange(conv.title);
          }}
          className="flex-1 text-sm bg-transparent border-b border-blue-400 outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 text-sm truncate">{conv.title || "Untitled"}</span>
      )}

      {(hovered || isActive) && !isRenaming && (
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onStartRename}
            className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-neutral-500 hover:text-red-600"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
