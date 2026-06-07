import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// GET /api/user — fetch current user profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, avatar_url: true, provider: true, created_at: true },
  });

  return NextResponse.json(user);
}

// PATCH /api/user — update name and/or avatar
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  // JSON body: name-only update
  if (contentType.includes("application/json")) {
    const { name } = await req.json() as { name?: string };
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    }
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() },
      select: { id: true, name: true, email: true, avatar_url: true },
    });
    return NextResponse.json(updated);
  }

  // FormData: avatar upload
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, and WebP are allowed." }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds 5 MB." }, { status: 413 });
    }

    // Delete old avatar from Cloudinary if it exists
    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar_url: true },
    });
    if (existing?.avatar_url && existing.avatar_url.includes("cloudinary")) {
      const publicId = existing.avatar_url
        .split("/")
        .slice(-2)
        .join("/")
        .replace(/\.[^.]+$/, "");
      await deleteFromCloudinary(publicId).catch(() => {});
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, "avatars", `user_${session.user.id}`);

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar_url: result.secure_url },
      select: { id: true, name: true, email: true, avatar_url: true },
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
}
