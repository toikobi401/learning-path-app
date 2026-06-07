import { prisma } from "@/lib/prisma";

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Replaces any existing token for this identifier, then creates a fresh one.
 * identifier convention:
 *   "verify:{email}"  — email verification
 *   "reset:{email}"   — password reset
 */
export async function createOtpToken(identifier: string, otp: string): Promise<void> {
  const expires = new Date(Date.now() + OTP_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: otp, expires },
  });
}

export async function verifyOtpToken(
  identifier: string,
  otp: string
): Promise<{ valid: boolean; expired: boolean }> {
  const record = await prisma.verificationToken.findFirst({
    where: { identifier, token: otp },
  });

  if (!record) return { valid: false, expired: false };
  if (record.expires < new Date()) return { valid: false, expired: true };

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier, token: otp } },
  });

  return { valid: true, expired: false };
}
