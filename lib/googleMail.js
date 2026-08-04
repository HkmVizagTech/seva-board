// Sends mail through a Google Workspace mailbox (e.g. noreply@harekrishnavizag.org) using
// Gmail's SMTP relay with an app password. This is the simplest route for a fixed,
// shared "no-reply" sender that everyone's assignment emails come from — no Google Cloud
// project, service account, or OAuth consent screen needed. See README.md for setup.

import nodemailer from "nodemailer";

export function googleConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

let cachedTransporter = null;
function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  return cachedTransporter;
}

export async function sendGoogleMail({ to, subject, html }) {
  const transporter = getTransporter();
  const displayName = process.env.GMAIL_FROM_NAME || "Seva Board";
  await transporter.sendMail({
    from: `${displayName} <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
  return { ok: true };
}
