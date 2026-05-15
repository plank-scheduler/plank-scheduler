import type { NextApiRequest, NextApiResponse } from "next";
import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

type UploadResp =
  | { ok: true; url: string }
  | { ok: false; error: string };

function safeFileName(name: string) {
  return String(name || "upload.jpg")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 120);
}

function base64ToBuffer(base64: string) {
  const cleaned = String(base64 || "");
  const parts = cleaned.split(",");
  const data = parts.length > 1 ? parts[1] : cleaned;

  return Buffer.from(data, "base64");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResp>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method Not Allowed",
    });
  }

  try {
    const { fileName, base64 } = req.body || {};

    if (!base64) {
      return res.status(400).json({
        ok: false,
        error: "Missing photo data",
      });
    }

    const cleanName = safeFileName(fileName);
    const uniqueName = `booking-photos/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}-${cleanName}`;

    const buffer = base64ToBuffer(base64);

    const blob = await put(uniqueName, buffer, {
      access: "public",
      contentType: "image/jpeg",
    });

    return res.status(200).json({
      ok: true,
      url: blob.url,
    });
  } catch (err: any) {
    console.error("Blob photo upload failed:", err);

    return res.status(500).json({
      ok: false,
      error: err.message || "Upload failed",
    });
  }
}