import type { AiTask, ProviderId } from "./types";

// Model mặc định hệ thống cho từng task (dạng "provider:modelId").
export const DEFAULT_MODELS: Record<AiTask, string> = {
  generation: "groq:llama-3.3-70b-versatile",
  chat: "groq:llama-3.1-8b-instant",
};

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  requiresBaseUrl: boolean;
  envKey?: string; // tên biến env chứa key cấp hệ thống
  models: { id: string; label: string }[]; // rỗng = user tự nhập (custom)
}

// Catalog provider + model cho dropdown UI. Model id phải đúng theo từng provider.
export const PROVIDERS: ProviderInfo[] = [
  {
    id: "groq",
    label: "Groq",
    requiresBaseUrl: false,
    envKey: "GROQ_API_KEY",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (versatile)" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (instant)" },
      { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    requiresBaseUrl: false,
    envKey: "ANTHROPIC_API_KEY",
    models: [
      { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
    ],
  },
  {
    id: "google",
    label: "Google (Gemini)",
    requiresBaseUrl: false,
    envKey: "GOOGLE_AI_API_KEY",
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    ],
  },
  {
    id: "openai",
    label: "OpenAI (GPT)",
    requiresBaseUrl: false,
    envKey: "OPENAI_API_KEY",
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o mini" },
    ],
  },
  {
    id: "custom",
    label: "Custom (OpenAI-compatible)",
    requiresBaseUrl: true,
    models: [], // user nhập model id thủ công
  },
];

export function getProviderInfo(provider: ProviderId): ProviderInfo | undefined {
  return PROVIDERS.find((p) => p.id === provider);
}

/** Parse "provider:modelId" → { provider, model }. null nếu sai định dạng. */
export function parseModelRef(
  ref: string
): { provider: ProviderId; model: string } | null {
  const idx = ref.indexOf(":");
  if (idx < 0) return null;
  const provider = ref.slice(0, idx) as ProviderId;
  const model = ref.slice(idx + 1);
  if (!PROVIDERS.some((p) => p.id === provider) || !model) return null;
  return { provider, model };
}
