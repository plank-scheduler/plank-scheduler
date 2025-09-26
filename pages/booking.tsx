// pages/booking.tsx

import Head from "next/head";
import BookingClient from "../components/BookingClient";
import { BRAND } from "../lib/config";

export default function BookingPage() {
  return (
    <>
      <Head>
        <title>{BRAND} — Booking</title>
      </Head>

      <main style={{ maxWidth: 1100, margin: "40px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>
          {BRAND} — Booking
        </h1>
        <BookingClient />
      </main>
    </>
  );
}
