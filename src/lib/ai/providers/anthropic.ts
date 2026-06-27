import Anthropic from "@anthropic-ai/sdk";
import type { AiProvider, AiMessage, ProviderCallOptions } from "../types";

// Provider Anthropic (Claude). SDK tách `system` khỏi messages, `max_tokens` bắt buộc.
// Không gửi `temperature`: các model mới (Opus 4.8/4.7, Fable) trả 400 nếu có.
// JSON: dựa vào instruction "JSON only" đã có sẵn trong prompt (Claude không có json_object mode).

const DEFAULT_MAX_TOKENS = 4096;

function splitMessages(messages: AiMessage[]): {
  system: string;
  msgs: { role: "user" | "assistant"; content: string }[];
} {
  const systemParts: string[] = [];
  const msgs: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of messages) {
    if (m.role === "system") systemParts.push(m.content);
    else msgs.push({ role: m.role, content: m.content });
  }
  return { system: systemParts.join("\n\n"), msgs };
}

export const anthropicProvider: AiProvider = {
  async complete(opts) {
    const client = new Anthropic({ apiKey: opts.apiKey });
    const { system, msgs } = splitMessages(opts.messages);
    const res = await client.messages.create({
      model: opts.model,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      ...(system ? { system } : {}),
      messages: msgs.length ? msgs : [{ role: "user", content: " " }],
    });
    return res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  },

  async *stream(opts) {
    const client = new Anthropic({ apiKey: opts.apiKey });
    const { system, msgs } = splitMessages(opts.messages);
    const stream = client.messages.stream({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 1024,
      ...(system ? { system } : {}),
      messages: msgs.length ? msgs : [{ role: "user", content: " " }],
    });
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  },
};
