import nodemailer from "nodemailer";

export function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export const FROM_EMAIL = process.env.EMAIL_FROM || "Littera <noreply@littera.app>";
const FROM = FROM_EMAIL;

export async function sendReportReplyNotification(email: string, name: string | null, message: string, reply: string) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("SMTP not configured — skipping report reply email");
    return;
  }

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "[Littera] Admin replied to your report",
    html: `<p>Hi ${name || "there"},</p>
<p>An admin has replied to your report:</p>
<p><strong>Your report:</strong><br>${message}</p>
<p style="padding:12px;background:#F7F7F8;border-radius:8px"><strong>Admin reply:</strong><br>${reply}</p>
<p>You can view the full conversation in your <a href="${process.env.APP_URL || "http://localhost:3000"}/reports">Reports page</a>.</p>`,
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("SMTP not configured — skipping verification email");
    return;
  }

  const url = `${process.env.APP_URL || "http://localhost:3000"}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Verify your email — Littera",
    html: `<p>Click the link below to verify your email address:</p><p><a href="${url}">${url}</a></p>`,
  });
}

export async function sendDeleteAccountCode(email: string, code: string) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("SMTP not configured — skipping delete account email");
    return;
  }

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Delete your account — Littera",
    html: `<p>You requested to delete your Littera account.</p><p>Your verification code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px;text-align:center;padding:12px;background:#F7F7F8;border-radius:8px">${code}</p><p>This code expires in 10 minutes.</p><p>If you didn't request this, you can ignore this email.</p>`,
  });
}

export async function sendResetPasswordEmail(email: string, token: string) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("SMTP not configured — skipping reset password email");
    return;
  }

  const url = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Reset your password — Littera",
    html: `<p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p>`,
  });
}
