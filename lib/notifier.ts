import nodemailer from "nodemailer";

// SMS disabled
function mailer() {
  const port = Number(process.env.SMTP_PORT || 587);
  if (!process.env.SMTP_HOST) throw new Error("SMTP not configured");

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! }
      : undefined,
  });
}

async function sendEmail(text: string, subject: string) {
  const to = process.env.NOTIFY_TO!;
  const from = process.env.NOTIFY_FROM || process.env.SMTP_USER || to;
  return await mailer().sendMail({ to, from, subject, text });
}

async function sendSMS(_: string) {
  return;
}

export async function notifyNewRequest(data: any) {
  const subject = `New booking request: ${[
    data.service || data.insulationService || data.lawnCare || data.holidayLighting || "service",
    data.date,
    data.time,
  ]
    .filter(Boolean)
    .join(" — ")}`;

  const text = `New booking request

Name:    ${data.customer?.name || ""}
Phone:   ${data.customer?.phone || ""}
Address: ${data.customer?.address || ""}
Email:   ${data.customer?.email || ""}

Date: ${data.date}
Preferred time: ${data.time}
Plan: ${data.plan || "—"}
Service: ${data.service || "—"}
Insulation Service: ${data.insulationService || "—"}
Holiday Lighting: ${data.holidayLighting || "—"}
Lawn Care: ${data.lawnCare || "—"}
Notes: ${data.notes || "—"}
Status: pending — please call/text/email to confirm with the customer.`;

  let emailInfo: any = null;

  try {
    emailInfo = await sendEmail(text, subject);
  } catch (err) {
    console.error("sendEmail failed:", err);
  }

  try {
    await sendSMS(text);
  } catch (err) {
    console.error("sendSMS failed:", err);
  }

  return emailInfo;
}