import type { NextApiRequest, NextApiResponse } from "next";
import { initializeDatabase, pool } from "@/lib/db";

const VALID_STATUSES = [
  "New",
  "Contacted",
  "Responded",
  "Scheduled",
  "Completed",
  "Cancelled",
  "Archived",
];

function checkAdminPassword(req: NextApiRequest) {
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return true;
  }

  const provided = req.headers["x-admin-password"];

  return provided === expected;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      success: false,
      error: "Method Not Allowed",
    });
  }

  if (!checkAdminPassword(req)) {
    return res.status(401).json({
      ok: false,
      success: false,
      error: "Unauthorized",
    });
  }

  try {
    await initializeDatabase();

    const { id, status, officeNotes, archived, deleted } = req.body || {};

    if (!id) {
      return res.status(400).json({
        ok: false,
        success: false,
        error: "Missing appointment id",
      });
    }

    if (deleted === true) {
      await pool.query("DELETE FROM appointments WHERE id = $1", [id]);

      return res.status(200).json({
        ok: true,
        success: true,
        deleted: true,
      });
    }

    if (typeof status === "string") {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          ok: false,
          success: false,
          error: "Invalid status",
        });
      }

      await pool.query(
        `
        UPDATE appointments
        SET status = $1,
            status_updated_at = NOW()
        WHERE id = $2
        `,
        [status, id]
      );
    }

    if (typeof officeNotes === "string") {
      await pool.query(
        `
        UPDATE appointments
        SET office_notes = $1
        WHERE id = $2
        `,
        [officeNotes, id]
      );
    }

    if (typeof archived === "boolean") {
      await pool.query(
        `
        UPDATE appointments
        SET archived = $1,
            archived_at = CASE WHEN $1 = TRUE THEN NOW() ELSE NULL END
        WHERE id = $2
        `,
        [archived, id]
      );
    }

    const result = await pool.query(
      `
      SELECT *
      FROM appointments
      WHERE id = $1
      `,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        ok: false,
        success: false,
        error: "Appointment not found",
      });
    }

    const row = result.rows[0];

    return res.status(200).json({
      ok: true,
      success: true,
      appointment: {
        id: String(row.id),
        createdAt: row.created_at,

        customer: {
          name: row.customer_name || "",
          phone: row.customer_phone || "",
          email: row.customer_email || "",
          address: row.address || "",
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

        archived: !!row.archived,
        archivedAt: row.archived_at || null,
        statusUpdatedAt: row.status_updated_at || null,

        photoUrls: row.photo_urls || [],
      },
    });
  } catch (err: any) {
    console.error("update-appointment failed:", err);

    return res.status(500).json({
      ok: false,
      success: false,
      error: err.message || "Server error",
    });
  }
}