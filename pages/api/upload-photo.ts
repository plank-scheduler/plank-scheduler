import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  try {
    const { fileName, base64 } = req.body ?? {};

    if (!fileName || !base64) {
      return res.status(400).json({
        ok: false,
        error: "Missing file data",
      });
    }

    const matches = base64.match(/^data:(.+);base64,(.+)$/);

    if (!matches) {
      return res.status(400).json({
        ok: false,
        error: "Invalid image format",
      });
    }

    const extension = path.extname(fileName) || ".jpg";

    const safeName =
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2) +
      extension;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, safeName);

    fs.writeFileSync(filePath, matches[2], "base64");

    return res.status(200).json({
      ok: true,
      url: `/uploads/${safeName}`,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      ok: false,
      error: "Upload failed",
    });
  }
}