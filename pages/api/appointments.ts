import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { notifyNewRequest } from "@/lib/notifier";

const DATA_DIR = path.join(process.cwd(), "data");
const APPOINTMENTS_FILE = path.join(DATA_DIR, "appointments.json");

function trySaveAppointment(entry: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let appointments: any[] = [];

    if (fs.existsSync(APPOINTMENTS_FILE)) {
      const raw = fs.readFileSync(APPOINTMENTS_FILE, "utf8");
      appointments = JSON.parse(raw || "[]");
      if (!Array.isArray(appointments)) appointments = [];
    }

    appointments.unshift(entry);

    fs.writeFileSync(
      APPOINTMENTS_FILE,
      JSON.stringify(appointments, null, 2),
      "utf8"
    );

    return true;
  } catch (err) {
    console.warn("Appointment was not saved to local JSON storage:", err);
    return false;
  }
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

  const entry = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...payload,
  };

  let messageId: string | null = null;

  try {
    const info: any = await notifyNewRequest(payload);
    messageId = info?.messageId ?? null;
    console.log("Email send result:", info);
  } catch (err) {
    console.error("notifyNewRequest failed:", err);

    return res.status(500).json({
      ok: false,
      error: "Email notification failed",
    });
  }

  const saved = trySaveAppointment(entry);

  return res.status(200).json({
    ok: true,
    id: entry.id,
    messageId,
    saved,
    date: payload.date,
    time: payload.time,
    plan: payload.plan,
    service: payload.service,
    insulationService: payload.insulationService,
    lawnCare: payload.lawnCare,
    holidayLighting: payload.holidayLighting,
    notes: payload.notes,
    photoUrls: payload.photoUrls || [],
  });
}