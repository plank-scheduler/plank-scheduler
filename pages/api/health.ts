import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const { fieldster } = await import("../../lib/fieldster");
    return res.status(200).json({ ok: true, env: fieldster.health() });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: String(err?.stack || err) });
  }
}
