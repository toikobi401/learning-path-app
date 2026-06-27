import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseModelRef } from "@/lib/ai/registry";

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
    ai_generation_model: settings?.ai_generation_model ?? null,
    ai_chat_model: settings?.ai_chat_model ?? null,
    pomodoro_focus_min: settings?.pomodoro_focus_min ?? 25,
    pomodoro_break_min: settings?.pomodoro_break_min ?? 5,
    pomodoro_long_break_min: settings?.pomodoro_long_break_min ?? 15,
    pomodoro_rounds: settings?.pomodoro_rounds ?? 4,
    leaderboard_opt_in: settings?.leaderboard_opt_in ?? true,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    ui_language?: string;
    ai_language?: string;
    show_chat_widget?: boolean;
    ai_generation_model?: string | null;
    ai_chat_model?: string | null;
    pomodoro_focus_min?: number;
    pomodoro_break_min?: number;
    pomodoro_long_break_min?: number;
    pomodoro_rounds?: number;
    leaderboard_opt_in?: boolean;
  };

  const data: {
    ui_language?: string;
    ai_language?: string;
    show_chat_widget?: boolean;
    ai_generation_model?: string | null;
    ai_chat_model?: string | null;
    pomodoro_focus_min?: number;
    pomodoro_break_min?: number;
    pomodoro_long_break_min?: number;
    pomodoro_rounds?: number;
    leaderboard_opt_in?: boolean;
  } = {};
  if (body.ui_language && ALLOWED_LANGS.includes(body.ui_language)) {
    data.ui_language = body.ui_language;
  }
  if (body.ai_language && ALLOWED_LANGS.includes(body.ai_language)) {
    data.ai_language = body.ai_language;
  }
  if (typeof body.show_chat_widget === "boolean") {
    data.show_chat_widget = body.show_chat_widget;
  }
  // null = bỏ chọn (về default hệ thống); chuỗi phải đúng dạng "provider:modelId"
  if ("ai_generation_model" in body) {
    if (body.ai_generation_model === null) data.ai_generation_model = null;
    else if (parseModelRef(body.ai_generation_model ?? "")) data.ai_generation_model = body.ai_generation_model;
    else return NextResponse.json({ error: "ai_generation_model không hợp lệ." }, { status: 400 });
  }
  if ("ai_chat_model" in body) {
    if (body.ai_chat_model === null) data.ai_chat_model = null;
    else if (parseModelRef(body.ai_chat_model ?? "")) data.ai_chat_model = body.ai_chat_model;
    else return NextResponse.json({ error: "ai_chat_model không hợp lệ." }, { status: 400 });
  }

  // Cấu hình Pomodoro: kẹp trong khoảng hợp lệ
  const clampInt = (v: unknown, min: number, max: number): number | undefined => {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) return undefined;
    return Math.min(max, Math.max(min, n));
  };
  if ("pomodoro_focus_min" in body) {
    const v = clampInt(body.pomodoro_focus_min, 1, 180);
    if (v !== undefined) data.pomodoro_focus_min = v;
  }
  if ("pomodoro_break_min" in body) {
    const v = clampInt(body.pomodoro_break_min, 1, 60);
    if (v !== undefined) data.pomodoro_break_min = v;
  }
  if ("pomodoro_long_break_min" in body) {
    const v = clampInt(body.pomodoro_long_break_min, 1, 120);
    if (v !== undefined) data.pomodoro_long_break_min = v;
  }
  if ("pomodoro_rounds" in body) {
    const v = clampInt(body.pomodoro_rounds, 1, 12);
    if (v !== undefined) data.pomodoro_rounds = v;
  }
  if (typeof body.leaderboard_opt_in === "boolean") {
    data.leaderboard_opt_in = body.leaderboard_opt_in;
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
    ai_generation_model: settings.ai_generation_model,
    ai_chat_model: settings.ai_chat_model,
    pomodoro_focus_min: settings.pomodoro_focus_min,
    pomodoro_break_min: settings.pomodoro_break_min,
    pomodoro_long_break_min: settings.pomodoro_long_break_min,
    pomodoro_rounds: settings.pomodoro_rounds,
    leaderboard_opt_in: settings.leaderboard_opt_in,
  });
}
