import type { NextApiRequest, NextApiResponse } from "next";
import { initializeDatabase, pool } from "@/lib/db";
import { notifyNewRequest } from "@/lib/notifier";

function getCustomer(data: any) {
  const customer = data.customer || {};

  return {
    name: customer.name || data.name || "",
    phone: customer.phone || data.phone || "",
    email: customer.email || data.email || "",
    address: customer.address || data.address || "",
    city: customer.city || data.city || "",
    state: customer.state || data.state || "",
    zip: customer.zip || data.zip || "",
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method Not Allowed",
    });
  }

  try {
    await initializeDatabase();

    const data = req.body || {};
    const customer = getCustomer(data);

    const photoUrls = Array.isArray(data.photoUrls) ? data.photoUrls : [];

    const result = await pool.query(
      `
      INSERT INTO appointments (
        customer_name,
        customer_phone,
        customer_email,
        address,
        city,
        state,
        zip,
        service,
        insulation_service,
        lawn_care,
        holiday_lighting,
        plan,
        date,
        time,
        notes,
        office_notes,
        status,
        archived,
        photo_urls
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      )
      RETURNING *
      `,
      [
        customer.name,
        customer.phone,
        customer.email,
        customer.address,
        customer.city,
        customer.state,
        customer.zip,

        data.service || "",
        data.insulationService || "",
        data.lawnCare || "",
        data.holidayLighting || "",

        data.plan || "",
        data.date || "",
        data.time || "",
        data.notes || "",

        "",
        "New",
        false,
        photoUrls,
      ]
    );

    let messageId: string | null = null;

    try {
      const info: any = await notifyNewRequest({
        ...data,
        customer,
        photoUrls,
      });

      messageId = info?.messageId || null;
    } catch (err) {
      console.error("Notification failure:", err);
    }

    const row = result.rows[0];

    return res.status(200).json({
      ok: true,
      id: String(row.id),
      messageId,
      date: row.date,
      time: row.time,
      plan: row.plan,
      service: row.service,
      insulationService: row.insulation_service,
      lawnCare: row.lawn_care,
      holidayLighting: row.holiday_lighting,
      notes: row.notes,
      photoUrls: row.photo_urls || [],
      createdAt: row.created_at,
    });
  } catch (err: any) {
    console.error("appointments API failed:", err);

    return res.status(500).json({
      ok: false,
      error: err.message || "Unknown server error",
    });
  }
}