import type { NextApiRequest, NextApiResponse } from "next";
import { initializeDatabase, pool } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await initializeDatabase();

  try {
    const result = await pool.query(`
      SELECT *
      FROM appointments
      ORDER BY created_at DESC
    `);

    const appointments = result.rows.map((row) => ({
      id: row.id,

      customer: {
        name: row.customer_name,
        phone: row.customer_phone,
        email: row.customer_email,

        address: row.address,
        city: row.city,
        state: row.state,
        zip: row.zip,
      },

      service: row.service,
      insulationService: row.insulation_service,
      lawnCare: row.lawn_care,
      holidayLighting: row.holiday_lighting,

      plan: row.plan,
      date: row.date,
      time: row.time,

      notes: row.notes,
      status: row.status,

      createdAt: row.created_at,
    }));

    return res.status(200).json({
      success: true,
      appointments,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      success: false,
      error: err.message || "Server error",
    });
  }
}