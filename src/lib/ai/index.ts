import { resolveCandidates } from "./resolve";
import { openaiCompatibleProvider } from "./providers/openai-compatible";
import { anthropicProvider } from "./providers/anthropic";
import { googleProvider } from "./providers/google";
import type { AiMessage, AiProvider, AiTask, ProviderId } from "./types";

export type { AiMessage, AiTask } from "./types";

const PROVIDER_IMPL: Record<ProviderId, AiProvider> = {
  groq: openaiCompatibleProvider,
  openai: openaiCompatibleProvider,
  custom: openaiCompatibleProvider,
  anthropic: anthropicProvider,
  google: googleProvider,
};

export interface AiCallOptions {
  messages: AiMessage[];
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}

const NO_PROVIDER_MSG =
  "Chưa cấu hình AI provider. Đặt GROQ_API_KEY trong env hoặc thêm API key trong Settings.";

/**
 * Gọi LLM (non-streaming) cho 1 task, trả về text. Tự fallback qua các provider
 * ứng viên nếu provider chính lỗi.
 */
export async function aiComplete(
  userId: string,
  task: AiTask,
  opts: AiCallOptions
): Promise<string> {
  const candidates = await resolveCandidates(userId, task);
  if (candidates.length === 0) throw new Error(NO_PROVIDER_MSG);

  let lastErr: unknown;
  for (const c of candidates) {
    try {
      return await PROVIDER_IMPL[c.provider].complete({
        ...opts,
        model: c.model,
        apiKey: c.apiKey,
        baseUrl: c.baseUrl,
      });
    } catch (e) {
      lastErr = e;
      console.error(`[ai] complete failed on ${c.provider}:${c.model}`, e);
    }
  }
  throw lastErr ?? new Error("Tất cả AI provider đều lỗi.");
}

/**
 * Gọi LLM streaming, yield text delta. Fallback chỉ áp dụng nếu provider lỗi
 * TRƯỚC khi yield byte đầu tiên; đã stream được dữ liệu thì không đổi giữa chừng.
 */
export async function* aiStream(
  userId: string,
  task: AiTask,
  opts: AiCallOptions
): AsyncIterable<string> {
  const candidates = await resolveCandidates(userId, task);
  if (candidates.length === 0) throw new Error(NO_PROVIDER_MSG);

  let lastErr: unknown;
  for (const c of candidates) {
    let yielded = false;
    try {
      for await (const chunk of PROVIDER_IMPL[c.provider].stream({
        ...opts,
        model: c.model,
        apiKey: c.apiKey,
        baseUrl: c.baseUrl,
      })) {
        yielded = true;
        yield chunk;
      }
      return; // hoàn tất
    } catch (e) {
      lastErr = e;
      console.error(`[ai] stream failed on ${c.provider}:${c.model}`, e);
      if (yielded) throw e; // đã stream → không fallback giữa chừng
    }
  }
  throw lastErr ?? new Error("Tất cả AI provider đều lỗi.");
}
