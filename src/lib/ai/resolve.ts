import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import { DEFAULT_MODELS, getProviderInfo, parseModelRef } from "./registry";
import type { AiTask, ProviderId } from "./types";

export interface Candidate {
  provider: ProviderId;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

function systemEnvKey(provider: ProviderId): string | undefined {
  const info = getProviderInfo(provider);
  return info?.envKey ? process.env[info.envKey] : undefined;
}

function defaultBaseUrl(provider: ProviderId): string | undefined {
  // groq dùng endpoint OpenAI-compatible; openai dùng default của SDK;
  // anthropic/google dùng SDK riêng (không cần baseURL); custom lấy từ credential.
  return provider === "groq" ? GROQ_BASE_URL : undefined;
}

/**
 * Dựng chuỗi ứng viên cho 1 task theo thứ tự ưu tiên:
 *   1) model user chọn (UserSettings) + key tương ứng (user credential hoặc env)
 *   2) Groq + GROQ_API_KEY hệ thống + model mặc định (fallback bảo đảm)
 * Ứng viên không có key khả dụng sẽ bị bỏ qua.
 */
export async function resolveCandidates(
  userId: string,
  task: AiTask
): Promise<Candidate[]> {
  const [settings, creds] = await Promise.all([
    prisma.userSettings.findUnique({ where: { user_id: userId } }),
    prisma.userAiCredential.findMany({ where: { user_id: userId } }),
  ]);

  const credByProvider = new Map(creds.map((c) => [c.provider as ProviderId, c]));
  const candidates: Candidate[] = [];
  const seen = new Set<string>();

  function add(provider: ProviderId, model: string) {
    let apiKey: string | undefined;
    let baseUrl = defaultBaseUrl(provider);

    const cred = credByProvider.get(provider);
    if (cred) {
      try {
        apiKey = decryptSecret(cred.api_key_enc);
      } catch {
        apiKey = undefined;
      }
      if (provider === "custom") baseUrl = cred.base_url ?? undefined;
    }
    if (!apiKey) apiKey = systemEnvKey(provider);

    if (!apiKey) return; // không có key → bỏ
    if (provider === "custom" && !baseUrl) return; // custom bắt buộc base_url

    const id = `${provider}:${model}:${baseUrl ?? ""}`;
    if (seen.has(id)) return;
    seen.add(id);
    candidates.push({ provider, model, apiKey, baseUrl });
  }

  // 1) Model user chọn
  const selected =
    task === "generation"
      ? settings?.ai_generation_model
      : settings?.ai_chat_model;
  if (selected) {
    const ref = parseModelRef(selected);
    if (ref) add(ref.provider, ref.model);
  }

  // 2) Fallback Groq hệ thống
  const def = parseModelRef(DEFAULT_MODELS[task]);
  if (def) add(def.provider, def.model);

  return candidates;
}
