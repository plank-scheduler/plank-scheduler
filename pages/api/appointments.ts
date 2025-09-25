import type { NextApiRequest, NextApiResponse } from "next";
import fs from "node:fs/promises";
import path from "node:path";

type Apt = {
  id: string;
  customerId: number;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  createdAt: string;     // ISO
  service?: string;
  notes?: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "appointments.json");

async function load(): Promise<Apt[]> {
  try {
    const txt = await fs.readFile(FILE, "utf8");
    const json = JSON.parse(txt);
    return Array.isArray(json) ? json : (json.data ?? []);
  } catch {
    return [];
  }
}

async function save(items: Apt[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(items, null, 2), "utf8");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const qd = (req.query.date as string) || "";
      const items = await load();
      const filtered = qd ? items.filter(a => a.date === qd) : items;
      filtered.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
      return res.status(200).json({ ok: true, data: filtered });
    }

    if (req.method === "POST") {
      const { customerId, date, time, service = "", notes = "" } = req.body || {};
      if (!customerId || !date || !time) {
        return res.status(400).json({ ok: false, error: "Missing customerId, date or time" });
      }
      const items = await load();
      if (items.some(a => a.date === date && a.time === time)) {
        return res.status(409).json({ ok: false, error: "That time is already booked." });
      }
      const apt: Apt = {
        id: `apt_${Date.now()}`,
        customerId: Number(customerId),
        date,
        time,
        createdAt: new Date().toISOString(),
        service,
        notes,
      };
      items.push(apt);
      await save(items);
      return res.status(200).json({ ok: true, ...apt });
    }

    if (req.method === "DELETE") {
      const id = (req.query.id as string) || (req.body?.id as string);
      if (!id) return res.status(400).json({ ok: false, error: "Missing id" });
      const items = await load();
      const next = items.filter(a => a.id !== id);
      if (next.length === items.length) return res.status(404).json({ ok: false, error: "Not found" });
      await save(next);
      return res.status(200).json({ ok: true, id });
    }

    res.setHeader("Allow", "GET,POST,DELETE");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e: a


