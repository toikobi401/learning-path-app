import { GoogleGenerativeAI, type Content } from "@google/generative-ai";
import type { AiProvider, AiMessage, ProviderCallOptions } from "../types";

// Provider Google (Gemini). systemInstruction tách riêng; JSON qua responseMimeType.

function toGemini(messages: AiMessage[]): { system: string; contents: Content[] } {
  const systemParts: string[] = [];
  const contents: Content[] = [];
  for (const m of messages) {
    if (m.role === "system") {
      systemParts.push(m.content);
      continue;
    }
    contents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    });
  }
  return { system: systemParts.join("\n\n"), contents };
}

function buildModel(opts: ProviderCallOptions) {
  const genAI = new GoogleGenerativeAI(opts.apiKey);
  const { system, contents } = toGemini(opts.messages);
  const model = genAI.getGenerativeModel({
    model: opts.model,
    ...(system ? { systemInstruction: system } : {}),
    generationConfig: {
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
      ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
      ...(opts.maxTokens != null ? { maxOutputTokens: opts.maxTokens } : {}),
    },
  });
  return { model, contents };
}

export const googleProvider: AiProvider = {
  async complete(opts) {
    const { model, contents } = buildModel(opts);
    const res = await model.generateContent({ contents });
    return res.response.text();
  },

  async *stream(opts) {
    const { model, contents } = buildModel(opts);
    const res = await model.generateContentStream({ contents });
    for await (const chunk of res.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  },
};
