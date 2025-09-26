import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

type Apt = {
  id: string;
  customerId: number;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:mm
  plan?: string;
  service?: string;
  notes?: string;
  createdAt: string; // ISO
};

type NewCustomer = { name: string; phone?: string; address?: string };
type Customer = { id: number } & NewCustomer;

const DATA_DIR = path.join(process.cwd(), "data");
const APT_FILE = path.join(DATA_DIR, "appointments.json");
const CUST_FILE = path.join(DATA_DIR, "customers.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const txt = await fs.readFile(file, "utf8");
    const v = JSON.parse(txt);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
async function writeJson<T>(file: string, value: T) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

async function ensureCustomerId(body: any): Promise<number> {
  // admin mode: explicit numeric customerId
  if (typeof body?.customerId === "number" && body.customerId > 0) {
    return body.customerId;
  }
  // public mode: body.customer {name, phone, address}
  if (body?.customer?.name) {
    const all = await readJson<Customer[]>(CUST_FILE, []);
    const maxId = all.reduce((m, c) => Math.max(m, c.id), 0);
    const nextId = maxId + 1;
    const newCust: Customer = {
      id: nextId,
      name: String(body.customer.name).trim(),
      phone: String(body.customer.phone || ""),
      address: String(body.customer.address || "")
    };
    all.push(newCust);
    await writeJson(CUST_FILE, all);
    return nextId;
  }
  throw new Error("Missing customer information.");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "OPTIONS") {
      res.setHeader("Allow", "GET,POST,DELETE,OPTIONS");
      return res.status(204).end();
    }

    if (req.method === "GET") {
      const date = (req.query.date as string) || "";
      const all = await readJson<Apt[]>(APT_FILE, []);
      const data = date ? all.filter((a) => a.date === date) : all;
      return res.status(200).json({ ok: true, data });
    }

    if (req.method === "POST") {
      const { date, time, plan, service, notes } = req.body || {};
      if (!date) return res.status(400).json({ ok: false, error: "Missing date" });
      if (!time) return res.status(400).json({ ok: false, error: "Missing time" });

      const customerId = await ensureCustomerId(req.body);
      const all = await readJson<Apt[]>(APT_FILE, []);

      // conflict check: same date+time already taken
      if (all.some((a) => a.date === date && a.time === time)) {
        return res.status(409).json({ ok: false, error: "That time is already booked." });
      }

      const apt: Apt = {
        id: `apt_${Date.now()}`,
        customerId,
        date: String(date),
        time: String(time),
        plan: plan ? String(plan) : undefined,
        service: service ? String(service) : undefined,
        notes: notes ? String(notes) : undefined,
        createdAt: new Date().toISOString()
      };

      all.push(apt);
      await writeJson(APT_FILE, all);
      return res.status(200).json({ ok: true, ...apt });
    }

    if (req.method === "DELETE") {
      const id = (req.query.id as string) || (req.body ? req.body.id : "");
      if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

      const all = await readJson<Apt[]>(APT_FILE, []);
      const idx = all.findIndex((a) => a.id === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: "Not found" });

      const [deleted] = all.splice(idx, 1);
      await writeJson(APT_FILE, all);
      return res.status(200).json({ ok: true, deleted });
    }

    res.setHeader("Allow", "GET,POST,DELETE,OPTIONS");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
