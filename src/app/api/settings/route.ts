import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_LANGS = ["vi", "en"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.userSettings.findUnique({
    where: { user_id: session.user.id },
  });

  return NextResponse.json({
    ui_language: settings?.ui_language ?? "vi",
    ai_language: settings?.ai_language ?? "vi",
    show_chat_widget: settings?.show_chat_widget ?? true,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    ui_language?: string;
    ai_language?: string;
    show_chat_widget?: boolean;
  };

  const data: { ui_language?: string; ai_language?: string; show_chat_widget?: boolean } = {};
  if (body.ui_language && ALLOWED_LANGS.includes(body.ui_language)) {
    data.ui_language = body.ui_language;
  }
  if (body.ai_language && ALLOWED_LANGS.includes(body.ai_language)) {
    data.ai_language = body.ai_language;
  }
  if (typeof body.show_chat_widget === "boolean") {
    data.show_chat_widget = body.show_chat_widget;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const settings = await prisma.userSettings.upsert({
    where: { user_id: session.user.id },
    update: data,
    create: { user_id: session.user.id, ui_language: "vi", ai_language: "vi", ...data },
  });

  return NextResponse.json({
    ui_language: settings.ui_language,
    ai_language: settings.ai_language,
    show_chat_widget: settings.show_chat_widget,
  });
}
