import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const APPOINTMENTS_FILE = path.join(DATA_DIR, "appointments.json");

function readAppointments() {
  if (!fs.existsSync(APPOINTMENTS_FILE)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(APPOINTMENTS_FILE, "utf8");
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return [];
  } catch {
    return [];
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method Not Allowed",
    });
  }

  const appointments = readAppointments();

  return res.status(200).json({
    ok: true,
    count: appointments.length,
    data: appointments,
  });
}