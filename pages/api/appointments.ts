import type { NextApiRequest, NextApiResponse } from "next";

type Apt = { id: string; customerId: number; date: string; time: string; createdAt: string };

let APTS: Apt[] = []; // in-memory (resets on server restart)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // optional filters: ?date=YYYY-MM-DD
      const qd = (req.query.date as string) || "";
      const data = qd ? APTS.filter(a => a.date === qd) : APTS;
      return res.status(200).json({ ok: true, data });
    }

    if (req.method === "POST") {
      const { customerId, date, time } = req.body || {};
      if (!customerId) return res.status(400).json({ ok: false, error: "Missing customerId" });
      if (!date)       return res.status(400).json({ ok: false, error: "Missing date" });
      if (!time)       return res.status(400).json({ ok: false, error: "Missing time" });
      const id = `apt_${Date.now()}`;
      const createdAt = new Date().toISOString();
      const apt: Apt = { id, customerId: Number(customerId), date, time, createdAt };
      APTS.push(apt);
      return res.status(200).json({ ok: true, ...apt });
    }

    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: String(err?.stack || err) });
  }
}
