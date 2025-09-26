// pages/appointments.tsx
import React, { useEffect, useState } from "react";

type Apt = {
  id: string;
  customerId: number;
  date: string;
  time: string;
  plan?: string;
  service?: string;
  notes?: string;
  createdAt: string;
};

type ApiList = { ok: true; data: Apt[] } | { ok: false; error: string };
type ApiDelete = { ok: true; deleted: Apt } | { ok: false; error: string };

function isoToPrettyDate(iso: string) {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function AppointmentsPage() {
  const [items, setItems] = useState<Apt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/appointments");
      const j = (await r.json()) as ApiList;
      if (!("ok" in j) || !j.ok) throw new Error((j as any).error || "Failed to load");
      const sorted = [...j.data].sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
      );
      setItems(sorted);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function cancel(id: string) {
    if (!id) return;
    if (!confirm("Cancel this appointment?")) return;
    try {
      const r = await fetch("/api/appointments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = (await r.json()) as ApiDelete;
      if (!("ok" in j) || !j.ok) throw new Error((j as any).error || "Cancel failed");
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      alert(`Cancel failed: ${String(e?.message || e)}`);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ maxWidth: 980, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 16 }}>Booked Appointments</h1>

      <button
        onClick={load}
        disabled={loading}
        style={{
          padding: "8px 14px",
          borderRadius: 6,
          border: "1px solid #ccc",
          background: "#f7f7f7",
          cursor: "pointer",
        }}
      >
        {loading ? "Loading…" : "Reload"}
      </button>

      {error ? (
        <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>
      ) : null}

      <div style={{ marginTop: 20 }}>
        {items.length === 0 ? (
          <p>No bookings yet.</p>
        ) : (
          <ul style={{ listStyle: "disc", paddingLeft: 18 }}>
            {items.map((a) => (
              <li
                key={a.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 14,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  {isoToPrettyDate(a.date)} at {a.time}
                  {a.plan ? ` • ${a.plan}` : ""}
                  {a.service ? ` • ${a.service}` : ""}
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong>Customer ID:</strong> {a.customerId}
                </div>
                {a.notes ? (
                  <div style={{ marginBottom: 6 }}>
                    <strong>Notes:</strong> {a.notes}
                  </div>
                ) : null}
                <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
                  <code>#{a.id}</code> • created{" "}
                  {new Date(a.createdAt).toLocaleString()}
                </div>
                <button
                  onClick={() => cancel(a.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    background: "#f8f8f8",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
