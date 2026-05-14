import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { notifyNewRequest } from "@/lib/notifier";

function formatValue(value: any) {
  return value && String(value).trim()
    ? String(value).trim()
    : "Not selected";
}

const DATA_DIR = path.join(process.cwd(), "data");
const APPOINTMENTS_FILE = path.join(DATA_DIR, "appointments.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(APPOINTMENTS_FILE)) {
    fs.writeFileSync(APPOINTMENTS_FILE, "[]", "utf8");
  }
}

function saveAppointment(payload: any) {
  ensureDataFile();

  const raw = fs.readFileSync(APPOINTMENTS_FILE, "utf8");

  let current = [];

  try {
    current = JSON.parse(raw);
  } catch {
    current = [];
  }

  const newAppointment = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...payload,
  };

  current.unshift(newAppointment);

  fs.writeFileSync(
    APPOINTMENTS_FILE,
    JSON.stringify(current, null, 2),
    "utf8"
  );

  return newAppointment;
}

async function sendCustomerConfirmation(payload: any) {
  const customer = payload?.customer;

  if (!customer?.email) {
    console.log("No customer email found.");
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const text = `
Hi ${customer.name || "there"},

Thank you for contacting Plank Termite & Pest Control.

We received your service request.

Requested Date: ${formatValue(payload.date)}
Preferred Time: ${formatValue(payload.time)}

Service Frequency: ${formatValue(payload.plan)}
Pest Control: ${formatValue(payload.service)}
Insulation: ${formatValue(payload.insulationService)}
Lawn Care: ${formatValue(payload.lawnCare)}
Holiday / Seasonal Lighting: ${formatValue(payload.holidayLighting)}

Address:
${formatValue(customer.address)}

Phone:
${formatValue(customer.phone)}

Notes:
${formatValue(payload.notes)}

This request has been sent to our office.
We will contact you to confirm your appointment.

Thank you,

The Plank Team
www.plankpest.com
`;

  const info = await transporter.sendMail({
    from: process.env.NOTIFY_FROM || process.env.SMTP_USER,
    to: customer.email,
    subject: "We received your request — Plank Pest Control",
    text,
  });

  console.log("Customer confirmation email result:", info);

  return info;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method Not Allowed",
    });
  }

  const payload = req.body ?? {};

  let officeMessageId: string | null = null;
  let customerMessageId: string | null = null;

  try {
    // SAVE REQUEST FIRST
    const savedAppointment = saveAppointment(payload);

    console.log("Appointment saved:", savedAppointment.id);

    // SEND OFFICE EMAIL
    const officeInfo: any = await notifyNewRequest(payload);

    officeMessageId = officeInfo?.messageId ?? null;

    console.log("Office email send result:", officeInfo);

    // SEND CUSTOMER EMAIL
    const customerInfo: any = await sendCustomerConfirmation(payload);

    customerMessageId = customerInfo?.messageId ?? null;

    return res.status(200).json({
      ok: true,
      id: savedAppointment.id,
      officeMessageId,
      customerMessageId,
      date: payload.date,
      time: payload.time,
    });
  } catch (err: any) {
    console.error("EMAIL/API ERROR:", err);

    return res.status(500).json({
      ok: false,
      error: String(err?.message || err),
    });
  }
}