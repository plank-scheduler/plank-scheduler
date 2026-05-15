import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

export const pool =
  global.pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

if (process.env.NODE_ENV !== "production") {
  global.pgPool = pool;
}

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,

      created_at TIMESTAMP DEFAULT NOW(),

      customer_name TEXT,
      customer_phone TEXT,
      customer_email TEXT,

      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,

      service TEXT,
      insulation_service TEXT,
      lawn_care TEXT,
      holiday_lighting TEXT,

      plan TEXT,
      date TEXT,
      time TEXT,

      notes TEXT,
      office_notes TEXT DEFAULT '',

      status TEXT DEFAULT 'New',
      status_updated_at TIMESTAMP DEFAULT NOW(),

      archived BOOLEAN DEFAULT FALSE,
      archived_at TIMESTAMP,

      photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[]
    );
  `);

  await pool.query(`
    ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS office_notes TEXT DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
  `);

  await pool.query(`
    ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
  `);

  await pool.query(`
    ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP DEFAULT NOW();
  `);

  await pool.query(`
    ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[];
  `);
}