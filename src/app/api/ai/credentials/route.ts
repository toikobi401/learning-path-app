import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret, maskSecret } from "@/lib/crypto";
import { getProviderInfo } from "@/lib/ai/registry";
import type { ProviderId } from "@/lib/ai/types";

const VALID_PROVIDERS: ProviderId[] = ["groq", "anthropic", "google", "openai", "custom"];

// GET /api/ai/credentials — list credential của user (key đã mask).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creds = await prisma.userAiCredential.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: "asc" },
  });

  const result = creds.map((c) => {
    let masked = "••••";
    try {
      masked = maskSecret(decryptSecret(c.api_key_enc));
    } catch {
      // bỏ qua nếu giải mã lỗi (đổi ENCRYPTION_KEY)
    }
    return {
      provider: c.provider,
      label: c.label,
      base_url: c.base_url,
      masked_key: masked,
      updated_at: c.updated_at,
    };
  });

  return NextResponse.json({ credentials: result });
}

// POST /api/ai/credentials — thêm/cập nhật key cho 1 provider (upsert theo user+provider).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    provider?: string;
    api_key?: string;
    base_url?: string;
    label?: string;
  };

  const provider = body.provider as ProviderId;
  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Provider không hợp lệ." }, { status: 400 });
  }
  if (!body.api_key?.trim()) {
    return NextResponse.json({ error: "API key là bắt buộc." }, { status: 400 });
  }

  const info = getProviderInfo(provider);
  const baseUrl = body.base_url?.trim() || null;
  if (info?.requiresBaseUrl && !baseUrl) {
    return NextResponse.json(
      { error: "Provider custom cần base URL (endpoint OpenAI-compatible)." },
      { status: 400 }
    );
  }

  const api_key_enc = encryptSecret(body.api_key.trim());

  await prisma.userAiCredential.upsert({
    where: { user_id_provider: { user_id: session.user.id, provider } },
    update: { api_key_enc, base_url: baseUrl, label: body.label?.trim() || null },
    create: {
      user_id: session.user.id,
      provider,
      api_key_enc,
      base_url: baseUrl,
      label: body.label?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/ai/credentials?provider=... — xóa key của 1 provider.
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = new URL(req.url).searchParams.get("provider") as ProviderId | null;
  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Provider không hợp lệ." }, { status: 400 });
  }

  await prisma.userAiCredential.deleteMany({
    where: { user_id: session.user.id, provider },
  });

  return NextResponse.json({ ok: true });
}
