import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtpToken } from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const { valid, expired } = await verifyOtpToken(`verify:${email}`, otp);

    if (expired) {
      return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 });
    }
    if (!valid) {
      return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 400 });
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("[VERIFY_EMAIL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
