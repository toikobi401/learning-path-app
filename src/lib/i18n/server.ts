import { prisma } from "@/lib/prisma";
import { translations, type Language } from "./translations";

export async function getServerTranslations(userId: string) {
  let lang: Language = "vi";
  try {
    const s = await prisma.userSettings.findUnique({
      where: { user_id: userId },
      select: { ui_language: true },
    });
    lang = ((s?.ui_language) ?? "vi") as Language;
  } catch {
    // Prisma client may be stale — default to "vi"
  }
  return { lang, t: translations[lang] };
}
