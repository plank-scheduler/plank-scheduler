import Head from "next/head";
import { BRAND } from "../lib/config"; // add this import

export default function BookingPage() {
  return (
    <>
      <Head>
        <title>{BRAND} | Booking</title>
      </Head>

      <main style={{ maxWidth: 960, margin: "32px auto", padding: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          {BRAND} — Booking
        </h1>

        {/* …rest of the page… */}
      </main>
    </>
  );
}
