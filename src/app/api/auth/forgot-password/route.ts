import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp, createOtpToken } from "@/lib/otp";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to avoid email enumeration
    if (user && user.password) {
      const otp = generateOtp();
      await createOtpToken(`reset:${email}`, otp);
      await sendPasswordResetEmail(email, otp);
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
