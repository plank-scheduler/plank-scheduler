import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const APPOINTMENTS_FILE = path.join(DATA_DIR, "appointments.json");

const VALID_STATUSES = ["New", "Contacted", "Scheduled", "Completed", "Cancelled"];

function readAppointments() {
  if (!fs.existsSync(APPOINTMENTS_FILE)) return [];

  try {
    const raw = fs.readFileSync(APPOINTMENTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAppointments(appointments: any[]) {
  fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2), "utf8");
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = req.headers["x-admin-password"];

  if (!adminPassword) {
    return res.status(500).json({ ok: false, error: "ADMIN_PASSWORD is not set in .env.local" });
  }

  if (providedPassword !== adminPassword) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const { id, status, officeNotes, archived, deleted } = req.body ?? {};

  if (!id) {
    return res.status(400).json({ ok: false, error: "Missing appointment id" });
  }

  const appointments = readAppointments();
  const index = appointments.findIndex((appt: any) => appt.id === id);

  if (index === -1) {
    return res.status(404).json({ ok: false, error: "Appointment not found" });
  }

  if (deleted === true) {
    const removed = appointments.splice(index, 1)[0];
    writeAppointments(appointments);

    return res.status(200).json({
      ok: true,
      deleted: true,
      appointment: removed,
    });
  }

  const updated = {
    ...appointments[index],
  };

  if (typeof status === "string") {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ ok: false, error: "Invalid status" });
    }

    updated.status = status;
    updated.statusUpdatedAt = new Date().toISOString();
  }

  if (typeof officeNotes === "string") {
    updated.officeNotes = officeNotes;
    updated.officeNotesUpdatedAt = new Date().toISOString();
  }

  if (typeof archived === "boolean") {
    updated.archived = archived;
    updated.archivedAt = archived ? new Date().toISOString() : null;
  }

  appointments[index] = updated;
  writeAppointments(appointments);

  return res.status(200).json({
    ok: true,
    appointment: updated,
  });
}