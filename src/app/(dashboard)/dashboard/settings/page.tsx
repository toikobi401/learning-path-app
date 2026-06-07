"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import type { Language } from "@/lib/i18n/translations";

type Settings = {
  ui_language: Language;
  ai_language: Language;
  show_chat_widget: boolean;
};

export default function SettingsPage() {
  const { t, lang, setLang } = useLanguage();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({
    ui_language: lang,
    ai_language: "vi",
    show_chat_widget: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Settings) => {
        setSettings(data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const updated = (await res.json()) as Settings;
        setSettings(updated);
        setLang(updated.ui_language);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        // Refresh layout so widget appears/disappears immediately
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-gray-500 dark:text-gray-400">
        {t.common.loading}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.settings.title}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t.settings.subtitle}</p>
      </div>

      <div className="space-y-6">
        {/* Language section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t.settings.language}
          </h2>

          <div className="space-y-5">
            {/* UI Language */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                {t.settings.uiLanguage}
              </label>
              <p className="mb-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {t.settings.uiLanguageDesc}
              </p>
              <div className="flex gap-3">
                {(["vi", "en"] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setSettings((s) => ({ ...s, ui_language: l }))}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                      settings.ui_language === l
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span>{l === "vi" ? "🇻🇳" : "🇺🇸"}</span>
                    <span>{t.settings[l]}</span>
                    {settings.ui_language === l && (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Language */}
            <div className="border-t border-gray-100 pt-5 dark:border-gray-800">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                {t.settings.aiLanguage}
              </label>
              <p className="mb-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {t.settings.aiLanguageDesc}
              </p>
              <div className="flex gap-3">
                {(["vi", "en"] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setSettings((s) => ({ ...s, ai_language: l }))}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                      settings.ai_language === l
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span>{l === "vi" ? "🇻🇳" : "🇺🇸"}</span>
                    <span>{t.settings[l]}</span>
                    {settings.ai_language === l && (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chat section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t.settings.chatSection}
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t.settings.chatWidget}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {t.settings.chatWidgetDesc}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={settings.show_chat_widget}
              onClick={() => setSettings((s) => ({ ...s, show_chat_widget: !s.show_chat_widget }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                settings.show_chat_widget
                  ? "bg-indigo-600 dark:bg-indigo-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  settings.show_chat_widget ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            {saving ? t.settings.saving : t.settings.save}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t.settings.saved}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
