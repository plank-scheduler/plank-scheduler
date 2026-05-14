import nodemailer from "nodemailer";

function transporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) throw new Error("SMTP not configured (missing SMTP_HOST)");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass: pass || "" } : undefined,
  });
}

export async function sendNewBookingEmail(data: any) {
  const to = process.env.NOTIFY_TO || "office@plankpest.com";
  const from = process.env.NOTIFY_FROM || process.env.SMTP_USER || "no-reply@plankpest.com";

  const subject = `New booking request: ${data.service || ""} — ${data.date} ${data.time}`.replace(/\s+/g, " ").trim();

  const lines = [
    "New booking request",
    "",
    `Name:    ${data.customer?.name || ""}`,
    `Phone:   ${data.customer?.phone || ""}`,
    `Address: ${data.customer?.address || ""}`,
    `Email:   ${data.customer?.email || ""}`,
    "",
    `Date:    ${data.date || ""}`,
    `Time:    ${data.time || ""} (customer preferred)`,
    `Plan:    ${data.plan || ""}`,
    `Service: ${data.service || ""}`,
    "",
    `Notes:   ${data.notes || ""}`,
    "",
    "Status:  pending (you will call/text to confirm)",
  ];

  const text = lines.join("\n");

  try {
    const tx = transporter();
    await tx.sendMail({ to, from, subject, text });
  } catch (e) {
    console.warn("sendNewBookingEmail: SMTP not configured or failed", e);
  }
}
