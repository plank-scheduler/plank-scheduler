import React, { useEffect, useState } from "react";

type Apt = {
  id: string;
  customerId: number;
  date: string;      // YYYY-MM-DD
  time: string;      // HH:mm
  service?: string;
  notes?: string;
  createdAt: string; // ISO string
};

type ApiList = { ok: true; data: Apt[] } | { ok: false; error: string };
type ApiDelete = { ok: true; deleted: Apt } | { ok: false; error: string };

function isoToPrettyDate(isoDate: string) {
  try {
    const [y, m, d] = isoDate.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return isoDate;
  }
}

export default function AppointmentsPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Apt[]>([]);
  const [error, setError] = useState<string>("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/appointments", { method: "GET" });
      const json = (await res.json()) as ApiList;

      if (!("ok" in json) || json.ok !== true) {
        const msg = ("error" in json && json.error) || "Failed to load";
        throw new Error(msg);
      }

      const sorted = [...json.data].sort((a, b) => {
        const aKey = `${a.date} ${a.time}`;
        const bKey = `${b.date} ${b.time}`;
        return aKey.localeCompare(bKey);
      });
      setItems(sorted);
    } catch (e: any) {
      setError(String((e as any)?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  async function cancel(id: string) {
    if (!id) return;
    if (!window.confirm("Cancel this appointment?")) return;

    try {
      const res = await fetch("/api/appointments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = (await res.json()) as ApiDelete;

      if (!("ok" in json) || json.ok !== true) {
        const msg = ("error" in json && json.error) || "Failed to cancel";
        throw new Error(msg);
      }

      setItems(prev => prev.filter(a => a.id !== id));
    } catch (e: any) {
      alert(`Cancel failed: ${String((e as any)?.message ?? e)}`);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
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
        <p style={{ color: "crimson", marginTop: 16 }}>{error}</p>
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
