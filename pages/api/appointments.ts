import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

type Apt = {
  id: string;
  customerId: number;
  date: string;      // YYYY-MM-DD
  time: string;      // HH:mm
  service?: string;
  notes?: string;
  createdAt: string; // ISO
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "appointments.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, "[]", "utf8");
  }
}

async function readAll(): Promise<Apt[]> {
  await ensureStore();
  try {
    const txt = await fs.readFile(FILE, "utf8");
    const arr = JSON.parse(txt);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function writeAll(items: Apt[]) {
  await ensureStore();
  await fs.writeFile(FILE, JSON.stringify(items, null, 2), "utf8");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // CORS hint / method list
    if (req.method === "OPTIONS") {
      res.setHeader("Allow", "GET,POST,DELETE,OPTIONS");
      return res.status(204).end();
    }

    if (req.method === "GET") {
      // optional filter by ?date=YYYY-MM-DD
      const qd = (req.query.date as string) || "";
      const all = await readAll();
      const data = qd ? all.filter(a => a.date === qd) : all;
      return res.status(200).json({ ok: true, data });
    }

    if (req.method === "POST") {
      const { customerId, date, time, service, notes } = (req.body ?? {}) as Partial<Apt>;
      if (!customerId) return res.status(400).json({ ok: false, error: "Missing customerId" });
      if (!date)       return res.status(400).json({ ok: false, error: "Missing date" });
      if (!time)       return res.status(400).json({ ok: false, error: "Missing time" });

      const all = await readAll();

      // Prevent double-booking exact same date & time
      if (all.some(a => a.date === date && a.time === time)) {
        return res.status(409).json({ ok: false, error: "That time is already booked." });
      }

      const apt: Apt = {
        id: `apt_${Date.now()}`,
        customerId: Number(customerId),
        date,
        time,
        service,
        notes,
        createdAt: new Date().toISOString(),
      };

      all.push(apt);
      await writeAll(all);
      return res.status(200).json({ ok: true, ...apt });
    }

    if (req.method === "DELETE") {
      const id = (req.query.id as string) || ((req.body ?? {}) as any).id || "";
      if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

      const all = await readAll();
      const idx = all.findIndex(a => a.id === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: "Not found" });

      const [deleted] = all.splice(idx, 1);
      await writeAll(all);
      return res.status(200).json({ ok: true, deleted });
    }

    res.setHeader("Allow", "GET,POST,DELETE,OPTIONS");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e?.message ?? e) });
  }
}
