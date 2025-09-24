import React, { useEffect, useState } from "react";

type Apt = { id: string; customerId: number; date: string; time: string; createdAt: string };

export default function AppointmentsPage() {
  const [items, setItems] = useState<Apt[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/appointments", { cache: "no-store" });
    const json = await res.json();
    setItems(json.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <main style={{ maxWidth: 720, margin: "32px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>Booked Appointments</h1>
      <button onClick={load} style={{ padding: "8px 12px", marginBottom: 12 }}>Reload</button>
      {loading ? <div>Loading…</div> : null}
      {(!loading && items.length === 0) ? <div>No bookings yet.</div> : null}
      <ul style={{ display: "grid", gap: 8 }}>
        {items.map(a => (
          <li key={a.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <div><b>{a.date}</b> at <b>{a.time}</b></div>
            <div style={{ opacity: 0.8 }}>Customer ID: {a.customerId}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>#{a.id} • created {new Date(a.createdAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
