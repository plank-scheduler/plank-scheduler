import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { fieldster } = await import("../../lib/fieldster");
    const limit = Number((req.query.limit as string) ?? "10");
    const data = await fieldster.customers({ limit });
    return res.status(200).json({ data });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: String(err?.stack || err) });
  }
}
