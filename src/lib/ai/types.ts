// Lớp trừu tượng AI đa-provider — kiểu dữ liệu dùng chung.

export type AiTask = "generation" | "chat";

export type ProviderId = "groq" | "anthropic" | "google" | "openai" | "custom";

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Tham số chuẩn hóa truyền vào provider. */
export interface ProviderCallOptions {
  model: string; // model id thuần của provider (không có prefix)
  messages: AiMessage[];
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  apiKey: string;
  baseUrl?: string;
}

export interface AiProvider {
  complete(opts: ProviderCallOptions): Promise<string>;
  stream(opts: ProviderCallOptions): AsyncIterable<string>;
}
