import OpenAI from "openai";
import type { AiProvider, ProviderCallOptions } from "../types";

// Provider OpenAI-compatible — phục vụ groq | openai | custom (qua baseURL).

function makeClient(opts: ProviderCallOptions): OpenAI {
  return new OpenAI({ apiKey: opts.apiKey, baseURL: opts.baseUrl });
}

export const openaiCompatibleProvider: AiProvider = {
  async complete(opts) {
    const client = makeClient(opts);
    const res = await client.chat.completions.create({
      model: opts.model,
      messages: opts.messages,
      ...(opts.json ? { response_format: { type: "json_object" as const } } : {}),
      ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
      ...(opts.maxTokens != null ? { max_tokens: opts.maxTokens } : {}),
    });
    return res.choices[0]?.message?.content ?? "";
  },

  async *stream(opts) {
    const client = makeClient(opts);
    const stream = await client.chat.completions.create({
      model: opts.model,
      messages: opts.messages,
      stream: true,
      ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
      ...(opts.maxTokens != null ? { max_tokens: opts.maxTokens } : {}),
    });
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) yield text;
    }
  },
};
