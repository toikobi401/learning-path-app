import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const from = process.env.EMAIL_FROM ?? "PathAI <noreply@pathai.app>";

// ─── Templates ────────────────────────────────────────────────────────────────

function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PathAI</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #f3f4f6;">
              <span style="font-size:15px;font-weight:600;color:#111827;letter-spacing:-0.3px;">PathAI</span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f3f4f6;background:#f9fafb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This email was sent by PathAI. If you did not request this, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function otpBlock(otp: string) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center" style="background:#f3f4f6;border-radius:6px;padding:20px;">
          <span style="font-size:32px;font-weight:700;letter-spacing:10px;color:#111827;font-family:monospace;">
            ${otp}
          </span>
        </td>
      </tr>
    </table>`;
}

// ─── Send helpers ─────────────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, otp: string) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#111827;">Verify your email</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#6b7280;line-height:1.6;">
      Enter the code below to confirm your PathAI account.
    </p>
    ${otpBlock(otp)}
    <p style="margin:0;font-size:13px;color:#9ca3af;">
      This code expires in <strong style="color:#111827;">15 minutes</strong>.
    </p>`;

  await transporter.sendMail({
    from,
    to: email,
    subject: `${otp} is your PathAI verification code`,
    html: baseTemplate(content),
  });
}

export async function sendPasswordResetEmail(email: string, otp: string) {
  const content = `
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#111827;">Reset your password</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#6b7280;line-height:1.6;">
      We received a request to reset the password for this account.
      Use the code below to set a new password.
    </p>
    ${otpBlock(otp)}
    <p style="margin:0;font-size:13px;color:#9ca3af;">
      This code expires in <strong style="color:#111827;">15 minutes</strong>.
      If you did not request a password reset, no action is needed.
    </p>`;

  await transporter.sendMail({
    from,
    to: email,
    subject: `${otp} is your PathAI password reset code`,
    html: baseTemplate(content),
  });
}
