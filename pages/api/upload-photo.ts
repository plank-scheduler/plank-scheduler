import type { NextApiRequest, NextApiResponse } from "next";
import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Method not allowed",
      });
    }

    const { fileName, base64 } = req.body;

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
        error: "Invalid base64 image",
      });
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");

    const cleanName = `${Date.now()}-${fileName.replace(/\s+/g, "-")}`;

    const blob = await put(cleanName, buffer, {
      access: "public",
      contentType: mimeType,
    });

    return res.status(200).json({
      ok: true,
      url: blob.url,
    });
  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);

    return res.status(500).json({
      ok: false,
      error: err.message || "Upload failed",
    });
  }
}