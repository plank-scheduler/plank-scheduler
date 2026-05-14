import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

type PublicCustomer = { name: string; phone?: string; address?: string; email?: string };

type Apt = {
  id: string;
  date: string;    // YYYY-MM-DD
  time: string;    // HH:mm
  plan?: string;
  service?: string;
  notes?: string;
  createdAt: string;
  customerId?: number;      // admin flow
  customer?: PublicCustomer; // public flow
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "appointments.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { await fs.access(FILE); } catch { await fs.writeFile(FILE, "[]", "utf8"); }
}
async function readAll(): Promise<Apt[]> {
  await ensureStore();
  try {
    const txt = await fs.readFile(FILE, "utf8");
    const arr = JSON.parse(txt);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
async function writeAll(items: Apt[]) {
  await ensureStore();
  await fs.writeFile(FILE, JSON.stringify(items, null, 2), "utf8");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const qd = (req.query.date as string) || "";
      const all = await readAll();
      const data = qd ? all.filter(a => a.date === qd) : all;
      return res.status(200).json({ ok: true, data });
    }

    if (req.method === "POST") {
      const { customerId, customer, date, time, plan, service, notes } = req.body || {};
      if (!date) return res.status(400).json({ ok: false, error: "Missing date" });
      if (!time) return res.status(400).json({ ok: false, error: "Missing time" });

      const all = await readAll();
      if (all.some(a => a.date === date && a.time === time)) {
        return res.status(409).json({ ok: false, error: "That time is already booked." });
      }

      const id = `apt_${Date.now()}`;
      const createdAt = new Date().toISOString();
      const apt: Apt = {
        id, date, time, plan, service, notes, createdAt,
        ...(customerId ? { customerId: Number(customerId) } : {}),
        ...(customer ? { customer: {
          name: String(customer.name || "").trim(),
          phone: customer.phone ? String(customer.phone).trim() : undefined,
          address: customer.address ? String(customer.address).trim() : undefined,
          email: customer.email ? String(customer.email).trim() : undefined,
        }} : {}),
      };

      all.push(apt);
      await writeAll(all);
      return res.status(200).json({ ok: true, ...apt });
    }

    if (req.method === "DELETE") {
      const id = (req.query.id as string) || (req.body ? req.body.id : "");
      if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

      const all = await readAll();
      const idx = all.findIndex(a => a.id === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: "Not found" });

      const [deleted] = all.splice(idx, 1);
      await writeAll(all);
      return res.status(200).json({ ok: true, deleted });
    }

    res.setHeader("Allow", "GET,POST,DELETE");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
