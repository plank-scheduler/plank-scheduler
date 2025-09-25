import React, { useEffect, useState } from "react";

type Apt = {
  id: string;
  customerId: number;
  date: string;
  time: string;
  createdAt: string;
  service?: string;
  notes?: string;
};

export default function AppointmentsPage() {
  const [items, setItems] = useState<Apt[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/appointments", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      setItems(json.data || []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function cancel(id: string) {
    if (!confirm("Cancel this appointment?")) return;
    const res = await fetch(`/api/appointments?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) { alert(json.error || "Failed to cancel"); return; }
    setItems(items.filter(a => a.id !== id));
  }

  return (
    <main style={{ maxWidth: 800, margin: "32px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>Booked Appointments</h1>
      <button onClick={load} style={{ padding: "8px 12px", marginBottom: 12 }}>Reload</button>
      {err ? <div style={{ color: "crimson" }}>{err}</div> : null}
      {loading ? <div>Loading…</div> : null}
      {!loading && items.length === 0 ? <div>No bookings yet.</div> : null}

      <ul style={{ display: "grid", gap: 10, listStyle: "none", padding: 0 }}>
        {items.map(a => (
          <li key={a.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, display: "grid", gap: 6 }}>
            <div><b>{a.date}</b> at <b>{a.time}</b> {a.service ? <>• {a.service}</> : null}</div>
            <div style={{ opacity: 0.85 }}>Customer ID: {a.customerId}</div>
            {a.notes ? <div style={{ opacity: 0.85 }}>Notes: {a.notes}</div> : null}
            <div style={{ fontSize: 12, opacity: 0.65 }}>#{a.id} • created {new Date(a.createdAt).toLocaleString()}</div>
            <div>
              <button onClick={() => cancel(a.id)} style={{ padding: "6px 10px" }}>Cancel</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
