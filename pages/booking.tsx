import React from "react";
import BookingClient from "../components/BookingClient";
import { BRAND, GREETING } from "../lib/config";

export default function BookingPage() {
  return (
    <main style={{ maxWidth: 1040, margin: "32px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 8 }}>
        {BRAND} — Booking
      </h1>

      <p style={{ marginBottom: 24 }}>
        {GREETING}
      </p>

      <BookingClient />
    </main>
  );
}
