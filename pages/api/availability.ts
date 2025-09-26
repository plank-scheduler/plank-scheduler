import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

type Apt = { date: string; time: string };

const DATA_DIR = path.join(process.cwd(), "data");
const APT_FILE = path.join(DATA_DIR, "appointments.json");

// Base schedule; customize anytime
const BASE_SLOTS = ["09:00", "10:30", "13:00", "15:30"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }
    const date = (req.query.date as string) || "";
    if (!date) return res.status(400).json({ ok: false, error: "Missing date" });

    let booked: Apt[] = [];
    try {
      const txt = await fs.readFile(APT_FILE, "utf8");
      booked = JSON.parse(txt) || [];
    } catch {}

    const taken = new Set(booked.filter((a) => a.date === date).map((a) => a.time));
    const open = BASE_SLOTS.filter((t) => !taken.has(t));
    return res.status(200).json({ ok: true, data: open });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
