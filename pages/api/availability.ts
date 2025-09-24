import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const date = (req.query.date as string) ?? new Date().toISOString().slice(0,10);
    // Closed on weekends
    const day = new Date(`${date}T00:00:00`).getDay(); // 0 Sun ... 6 Sat
    const slots = (day === 0 || day === 6) ? [] : ["09:00","10:30","13:00","15:30"];
    res.status(200).json({ date, slots });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: String(err?.stack || err) });
  }
}
