import type { NextApiRequest, NextApiResponse } from "next";
import { put } from "@vercel/blob";
import { MAX_PHOTO_BYTES, PHOTO_TYPES } from "@/lib/booking-options";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4.4mb",
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

    if (typeof fileName !== 'string' || typeof base64 !== 'string' || !fileName || !base64) {
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
    if (!PHOTO_TYPES.includes(mimeType) || !buffer.length || buffer.length > MAX_PHOTO_BYTES) {
      return res.status(400).json({ ok: false, error: 'Please use JPG, PNG or WebP photos, 3 MB or smaller.' });
    }
    const validImage = (mimeType === 'image/jpeg' && buffer[0] === 0xff && buffer[1] === 0xd8)
      || (mimeType === 'image/png' && buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
      || (mimeType === 'image/webp' && buffer.toString('ascii',0,4) === 'RIFF' && buffer.toString('ascii',8,12) === 'WEBP');
    if (!validImage) return res.status(400).json({ ok: false, error: 'This file is not a supported photo.' });

    const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/png' ? 'png' : 'webp';
    const cleanName = `request-photos/${crypto.randomUUID()}.${extension}`;

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
      error: "Photo upload failed. Please retry or remove the photo.",
    });
  }
}
