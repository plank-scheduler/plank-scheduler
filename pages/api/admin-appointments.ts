import type { NextApiRequest, NextApiResponse } from "next";
import { initializeDatabase, pool } from "@/lib/db";

function checkAdminPassword(req: NextApiRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return true;

  const provided = req.headers["x-admin-password"];
  return provided === expected;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!checkAdminPassword(req)) {
    return res.status(401).json({
      success: false,
      ok: false,
      error: "Unauthorized",
    });
  }

  try {
    await initializeDatabase();

    const result = await pool.query(`
      SELECT *
      FROM appointments
      ORDER BY created_at DESC
    `);

    const appointments = result.rows.map((row) => ({
      id: String(row.id),

      customer: {
        name: row.customer_name || "",
        phone: row.customer_phone || "",
        email: row.customer_email || "",
        address: row.address || "",
        city: row.city || "",
        state: row.state || "",
        zip: row.zip || "",
      },

      service: row.service || "",
      insulationService: row.insulation_service || "",
      lawnCare: row.lawn_care || "",
      holidayLighting: row.holiday_lighting || "",

      plan: row.plan || "",
      date: row.date || "",
      time: row.time || "",

      notes: row.notes || "",
      officeNotes: row.office_notes || "",
      status: row.status || "New",

      archived: row.archived === true,
      archivedAt: row.archived_at || null,
      statusUpdatedAt: row.status_updated_at || null,

      photoUrls: Array.isArray(row.photo_urls) ? row.photo_urls : [],

      createdAt: row.created_at,
    }));

    return res.status(200).json({
      success: true,
      ok: true,
      appointments,
      data: appointments,
    });
  } catch (err: any) {
    console.error("admin-appointments failed:", err);

    return res.status(500).json({
      success: false,
      ok: false,
      error: err.message || "Server error",
    });
  }
}