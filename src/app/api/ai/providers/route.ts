import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROVIDERS, DEFAULT_MODELS } from "@/lib/ai/registry";
import type { ProviderId } from "@/lib/ai/types";

// GET /api/ai/providers — catalog provider + models cho UI dropdown,
// kèm cờ provider nào user đã có key (hoặc có key hệ thống trong env).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creds = await prisma.userAiCredential.findMany({
    where: { user_id: session.user.id },
    select: { provider: true },
  });
  const userProviders = new Set(creds.map((c) => c.provider as ProviderId));

  const providers = PROVIDERS.map((p) => {
    const hasSystemKey = p.envKey ? Boolean(process.env[p.envKey]) : false;
    return {
      id: p.id,
      label: p.label,
      requiresBaseUrl: p.requiresBaseUrl,
      models: p.models,
      hasUserKey: userProviders.has(p.id),
      hasSystemKey,
      // có thể chọn nếu user đã nhập key, hoặc có key hệ thống (vd Groq)
      available: userProviders.has(p.id) || hasSystemKey,
    };
  });

  return NextResponse.json({ providers, defaults: DEFAULT_MODELS });
}
