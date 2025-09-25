import Head from "next/head";
import { BRAND } from "../lib/config"; // add this import

export default function AppointmentsPage() {
  return (
    <>
      <Head>
        <title>{BRAND} | Appointments</title>
      </Head>

      <main style={{ maxWidth: 720, margin: "32px auto", padding: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
          Booked Appointments
        </h1>
        {/* …rest of the page… */}
      </main>
    </>
  );
}
