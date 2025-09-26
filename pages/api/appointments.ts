// pages/api/appointments.ts
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

type Apt = {
  id: string;
  customerId: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  plan?: string;
  service?: string;
  notes?: string;
  createdAt: string; // ISO string
};

type ApiList = { ok: true; data: Apt[] } | { ok: false; error: string };
type ApiPost =
  | ({ ok: true } & Apt)
  | { ok: false; error: string };
type ApiDelete =
  | { ok: true; deleted: Apt }
  | { ok: false; error: string };

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

function truthy(q: any) {
  if (q === undefined || q === null) return false;
  const s = String(q).toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiList | ApiPost | ApiDelete>
) {
  try {
    if (req.method === "OPTIONS") {
      res.setHeader("Allow", "GET,POST,DELETE,OPTIONS");
      return res.status(204).end();
    }

    if (req.method === "GET") {
      const date = (req.query.date as string) || "";
      const items = await readAll();
      const data = date ? items.filter((a) => a.date === date) : items;

      const payload: ApiList = { ok: true, data };

      // pretty print if requested (?pretty=1)
      if (truthy(req.query.pretty)) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.status(200).send(JSON.stringify(payload, null, 2) as any);
      }
      return res.status(200).json(payload);
    }

    if (req.method === "POST") {
      const { customerId, date, time, plan, service, notes } = req.body || {};
      if (!customerId) return res.status(400).json({ ok: false, error: "Missing customerId" } as any);
      if (!date) return res.status(400).json({ ok: false, error: "Missing date" } as any);
      if (!time) return res.status(400).json({ ok: false, error: "Missing time" } as any);

      const items = await readAll();
      // conflict: same date & time
      if (items.some((a) => a.date === date && a.time === time)) {
        return res.status(409).json({ ok: false, error: "That time is already booked." } as any);
      }

      const id = `apt_${Date.now()}`;
      const createdAt = new Date().toISOString();
      const apt: Apt = {
        id,
        customerId: Number(customerId),
        date,
        time,
        plan,
        service,
        notes,
        createdAt,
      };

      items.push(apt);
      await writeAll(items);

      const payload: ApiPost = { ok: true, ...apt };
      return res.status(200).json(payload);
    }

    if (req.method === "DELETE") {
      const id = (req.query.id as string) || (req.body ? req.body.id : "");
      if (!id) return res.status(400).json({ ok: false, error: "Missing id" } as any);

      const items = await readAll();
      const idx = items.findIndex((a) => a.id === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: "Not found" } as any);

      const [deleted] = items.splice(idx, 1);
      await writeAll(items);
      return res.status(200).json({ ok: true, deleted });
    }

    res.setHeader("Allow", "GET,POST,DELETE,OPTIONS");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" } as any);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) } as any);
  }
}

