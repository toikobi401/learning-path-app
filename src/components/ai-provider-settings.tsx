"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/i18n/context";

type ProviderModel = { id: string; label: string };
type ProviderInfo = {
  id: string;
  label: string;
  requiresBaseUrl: boolean;
  models: ProviderModel[];
  hasUserKey: boolean;
  hasSystemKey: boolean;
  available: boolean;
};
type Credential = {
  provider: string;
  label: string | null;
  base_url: string | null;
  masked_key: string;
};

export default function AiProviderSettings() {
  const { t } = useLanguage();
  const at = t.settings.ai;

  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [creds, setCreds] = useState<Credential[]>([]);
  const [genModel, setGenModel] = useState<string>("");
  const [chatModel, setChatModel] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // form thêm key
  const [formProvider, setFormProvider] = useState("anthropic");
  const [formKey, setFormKey] = useState("");
  const [formBaseUrl, setFormBaseUrl] = useState("");
  const [formModel, setFormModel] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [provRes, credRes, setRes] = await Promise.all([
      fetch("/api/ai/providers"),
      fetch("/api/ai/credentials"),
      fetch("/api/settings"),
    ]);
    if (provRes.ok) setProviders((await provRes.json()).providers);
    if (credRes.ok) setCreds((await credRes.json()).credentials);
    if (setRes.ok) {
      const s = await setRes.json();
      setGenModel(s.ai_generation_model ?? "");
      setChatModel(s.ai_chat_model ?? "");
    }
  }, []);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  const formProviderInfo = providers.find((p) => p.id === formProvider);
  const formNeedsBaseUrl = formProviderInfo?.requiresBaseUrl ?? false;
  const formNeedsModelText = (formProviderInfo?.models.length ?? 0) === 0; // custom

  async function handleAddKey() {
    setErr(null);
    if (!formKey.trim()) return;
    setSavingKey(true);
    try {
      const res = await fetch("/api/ai/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: formProvider,
          api_key: formKey.trim(),
          base_url: formNeedsBaseUrl ? formBaseUrl.trim() : undefined,
        }),
      });
      if (!res.ok) {
        setErr((await res.json()).error ?? "Error");
        return;
      }
      // nếu custom + có model text → set luôn làm generation/chat? để user tự chọn sau
      void formModel;
      setFormKey("");
      setFormBaseUrl("");
      await reload();
    } finally {
      setSavingKey(false);
    }
  }

  async function handleRemoveKey(provider: string) {
    await fetch(`/api/ai/credentials?provider=${provider}`, { method: "DELETE" });
    await reload();
  }

  async function saveModel(field: "ai_generation_model" | "ai_chat_model", value: string) {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value === "" ? null : value }),
    });
  }

  // Option list cho dropdown model: default hệ thống + model của các provider available
  const modelOptions: { value: string; label: string }[] = [
    { value: "", label: at.systemDefault },
  ];
  for (const p of providers) {
    if (!p.available) continue;
    for (const m of p.models) {
      modelOptions.push({ value: `${p.id}:${m.id}`, label: `${p.label} — ${m.label}` });
    }
  }

  if (loading) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {at.section}
      </h2>
      <p className="mb-4 mt-1 text-xs text-gray-500 dark:text-gray-400">{at.sectionDesc}</p>

      {/* Model selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            {at.generationModel}
          </label>
          <select
            value={genModel}
            onChange={(e) => {
              setGenModel(e.target.value);
              void saveModel("ai_generation_model", e.target.value);
            }}
            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {modelOptions.map((o) => (
              <option key={`g-${o.value}`} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            {at.chatModel}
          </label>
          <select
            value={chatModel}
            onChange={(e) => {
              setChatModel(e.target.value);
              void saveModel("ai_chat_model", e.target.value);
            }}
            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {modelOptions.map((o) => (
              <option key={`c-${o.value}`} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* API keys */}
      <div className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
        <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">{at.keysTitle}</h3>

        {creds.length === 0 ? (
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{at.noKeys}</p>
        ) : (
          <ul className="mb-4 space-y-2">
            {creds.map((c) => {
              const info = providers.find((p) => p.id === c.provider);
              return (
                <li
                  key={c.provider}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
                >
                  <span className="text-gray-700 dark:text-gray-200">
                    <span className="font-medium">{info?.label ?? c.provider}</span>
                    <span className="ml-2 font-mono text-xs text-gray-400">{c.masked_key}</span>
                    {c.base_url && (
                      <span className="ml-2 text-xs text-gray-400">{c.base_url}</span>
                    )}
                  </span>
                  <button
                    onClick={() => handleRemoveKey(c.provider)}
                    className="text-xs font-medium text-red-500 hover:text-red-600"
                  >
                    {at.removeKey}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Add key form */}
        <div className="space-y-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                {at.providerLabel}
              </label>
              <select
                value={formProvider}
                onChange={(e) => setFormProvider(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              >
                {providers
                  .filter((p) => p.id !== "groq" || !p.hasSystemKey)
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                {at.apiKeyLabel}
              </label>
              <input
                type="password"
                value={formKey}
                onChange={(e) => setFormKey(e.target.value)}
                placeholder="sk-..."
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          {formNeedsBaseUrl && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                {at.baseUrlLabel}
              </label>
              <input
                type="text"
                value={formBaseUrl}
                onChange={(e) => setFormBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          )}

          {formNeedsModelText && (
            <input
              type="text"
              value={formModel}
              onChange={(e) => setFormModel(e.target.value)}
              placeholder="model-id (vd: gpt-4o-mini)"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          )}

          {err && <p className="text-xs text-red-500">{err}</p>}

          <button
            onClick={handleAddKey}
            disabled={savingKey || !formKey.trim()}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {at.addKey}
          </button>
        </div>
      </div>
    </div>
  );
}
