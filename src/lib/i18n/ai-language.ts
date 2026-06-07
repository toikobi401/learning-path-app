export function getAiLanguageInstruction(lang: string): string {
  if (lang === "en") {
    return "\n\nIMPORTANT: You must respond entirely in English. All content, labels, explanations, and feedback must be in English.";
  }
  return "\n\nIMPORTANT: Bạn phải trả lời hoàn toàn bằng tiếng Việt. Tất cả nội dung, nhãn, giải thích và phản hồi phải bằng tiếng Việt.";
}

// Use this for JSON-structured outputs: keeps all JSON keys in English,
// only writes string values (titles, descriptions, etc.) in the target language.
export function getAiJsonLanguageInstruction(lang: string): string {
  if (lang === "en") {
    return "\n\nIMPORTANT: Write all string values (titles, descriptions, overviews, questions, explanations) in English. Keep all JSON keys exactly as specified in the schema above.";
  }
  return "\n\nIMPORTANT: Viết tất cả các giá trị chuỗi (title, description, overview, question, explanation, v.v.) bằng tiếng Việt. Giữ nguyên tất cả các JSON key đúng như trong schema ở trên — không dịch tên key.";
}

export async function getUserAiLanguage(userId: string): Promise<string> {
  const { prisma } = await import("@/lib/prisma");
  const settings = await prisma.userSettings.findUnique({
    where: { user_id: userId },
    select: { ai_language: true },
  });
  return settings?.ai_language ?? "vi";
}
