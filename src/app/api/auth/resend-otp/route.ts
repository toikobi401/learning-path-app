import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp, createOtpToken } from "@/lib/otp";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success anyway to avoid email enumeration
      return NextResponse.json({ sent: true });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email is already verified" }, { status: 400 });
    }

    const otp = generateOtp();
    await createOtpToken(`verify:${email}`, otp);
    await sendVerificationEmail(email, otp);

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("[RESEND_OTP]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
