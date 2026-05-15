import nodemailer from "nodemailer";

function mailer() {
  const port = Number(process.env.SMTP_PORT || 587);

  if (!process.env.SMTP_HOST) {
    throw new Error("SMTP not configured");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!,
        }
      : undefined,
  });
}

function fromAddress() {
  return (
    process.env.NOTIFY_FROM ||
    process.env.SMTP_USER ||
    process.env.NOTIFY_TO ||
    "office@plankpest.com"
  );
}

function officeToAddress() {
  return process.env.NOTIFY_TO || process.env.SCHEDULER_TO || "office@plankpest.com";
}

function customerName(data: any) {
  return data.customer?.name || data.name || "";
}

function customerPhone(data: any) {
  return data.customer?.phone || data.phone || "";
}

function customerAddress(data: any) {
  return data.customer?.address || data.address || "";
}

function customerEmail(data: any) {
  return data.customer?.email || data.email || "";
}

function serviceSummary(data: any) {
  return [
    data.service ? `Pest Control: ${data.service}` : "",
    data.insulationService ? `Insulation: ${data.insulationService}` : "",
    data.lawnCare ? `Lawn Care: ${data.lawnCare}` : "",
    data.holidayLighting ? `Holiday / Seasonal Lighting: ${data.holidayLighting}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendOfficeEmail(data: any) {
  const subject = `New booking request: ${[
    data.service ||
      data.insulationService ||
      data.lawnCare ||
      data.holidayLighting ||
      "service",
    data.date,
    data.time,
  ]
    .filter(Boolean)
    .join(" — ")}`;

  const photoText =
    Array.isArray(data.photoUrls) && data.photoUrls.length
      ? data.photoUrls.map((url: string) => `Photo: ${url}`).join("\n")
      : "Photos: none";

  const text = `New booking request

Name:    ${customerName(data)}
Phone:   ${customerPhone(data)}
Address: ${customerAddress(data)}
Email:   ${customerEmail(data)}

Date: ${data.date || "—"}
Preferred time: ${data.time || "—"}
Plan: ${data.plan || "—"}

${serviceSummary(data) || "Service: —"}

Notes: ${data.notes || "—"}

${photoText}

Status: pending — please call/text/email to confirm with the customer.`;

  return await mailer().sendMail({
    to: officeToAddress(),
    from: fromAddress(),
    subject,
    text,
  });
}

async function sendCustomerEmail(data: any) {
  const to = customerEmail(data);

  if (!to) {
    console.warn("Customer confirmation skipped: no customer email found.");
    return null;
  }

  const subject = "We received your service request — Plank Termite & Pest Control";

  const text = `Hello ${customerName(data) || "there"},

Thank you for contacting Plank Termite & Pest Control. We received your service request.

Requested appointment:
Date: ${data.date || "—"}
Preferred time: ${data.time || "—"}
Plan: ${data.plan || "—"}

${serviceSummary(data) || "Service: —"}

Notes: ${data.notes || "—"}

Our office will review your request and contact you to confirm the appointment.

Thank you,

The Plank Team
www.plankpest.com
573-368-3333`;

  return await mailer().sendMail({
    to,
    from: fromAddress(),
    subject,
    text,
  });
}

async function sendSMS(_: string) {
  return;
}

export async function notifyNewRequest(data: any) {
  let officeEmailInfo: any = null;
  let customerEmailInfo: any = null;

  try {
    officeEmailInfo = await sendOfficeEmail(data);
  } catch (err) {
    console.error("Office email failed:", err);
    throw err;
  }

  try {
    customerEmailInfo = await sendCustomerEmail(data);
  } catch (err) {
    console.error("Customer confirmation email failed:", err);
  }

  try {
    await sendSMS("");
  } catch (err) {
    console.error("SMS failed:", err);
  }

  return {
    officeEmailInfo,
    customerEmailInfo,
    messageId: officeEmailInfo?.messageId || null,
  };
}